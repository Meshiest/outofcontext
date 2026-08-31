import { describe, it, expect, afterEach } from 'vitest';
import type { AddressInfo } from 'node:net';
import { createPrometheusMetrics } from '../server/metrics/prometheus';
import { metricsServerConfig, startMetricsServer } from '../server/metrics/server';

describe('metricsServerConfig', () => {
  /** Metrics are opt-in. An absent port must mean "no listener", never a guessed default. */
  it('is off unless METRICS_PORT is set', () => {
    expect(metricsServerConfig({})).toBeNull();
    expect(metricsServerConfig({ METRICS_PORT: '' })).toBeNull();
  });

  /**
   * A typo must not fall back to some other port. Binding an unintended port is exactly the mistake
   * the separate-listener design exists to prevent.
   */
  it('refuses to listen on an unparseable or out-of-range port', () => {
    expect(metricsServerConfig({ METRICS_PORT: 'nope' })).toBeNull();
    expect(metricsServerConfig({ METRICS_PORT: '0' })).toBeNull();
    expect(metricsServerConfig({ METRICS_PORT: '70000' })).toBeNull();
    expect(metricsServerConfig({ METRICS_PORT: '9090.5' })).toBeNull();
  });

  /** Localhost by default, so the endpoint stays private even if the port gets opened. */
  it('defaults to binding localhost, and takes an explicit host', () => {
    expect(metricsServerConfig({ METRICS_PORT: '9090' })).toEqual({
      port: 9090,
      host: '127.0.0.1',
    });
    expect(metricsServerConfig({ METRICS_PORT: '9090', METRICS_HOST: '0.0.0.0' })).toEqual({
      port: 9090,
      host: '0.0.0.0',
    });
  });
});

describe('the metrics endpoint', () => {
  const servers: Array<{ close: (cb: () => void) => void }> = [];

  afterEach(async () => {
    await Promise.all(
      servers.splice(0).map((s) => new Promise<void>((resolve) => s.close(() => resolve()))),
    );
  });

  async function scrape(path = '/metrics') {
    const { sink, registry } = createPrometheusMetrics();
    const server = startMetricsServer({ registry, port: 0, host: '127.0.0.1' });
    servers.push(server);
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    return { res, body: await res.text(), sink };
  }

  it('serves the registry in Prometheus text format', async () => {
    const { res, body } = await scrape();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain('# HELP ooc_build_info');
    expect(body).toContain('ooc_lobbies_active');
  });

  /** Default metrics are the reason to run this at all on a single-core box. */
  it('includes process and event loop metrics', async () => {
    const { body } = await scrape();
    expect(body).toContain('nodejs_eventloop_lag_seconds');
    expect(body).toContain('process_resident_memory_bytes');
  });

  it('serves nothing but /metrics', async () => {
    const { res } = await scrape('/');
    expect(res.status).toBe(404);
  });

  it('records events with their labels', async () => {
    const { sink, registry } = createPrometheusMetrics();
    sink.gameStarted({
      game: 'story',
      players: 4,
      country: 'DE',
      participants: ['DE', 'FR'],
      rocketcrab: false,
      config: { choices: [], numbers: [] },
    });
    sink.emoteSent({ emote: 'heart', game: 'story', country: 'FR', rocketcrab: false });
    sink.emoteSent({ emote: 'heart', rocketcrab: true });
    sink.reactionAdded({ reaction: 'heart', game: 'story', rocketcrab: false });
    sink.sessionStarted({ country: 'DE' });
    sink.sessionStarted({});

    const body = await registry.metrics();
    expect(body).toContain('ooc_games_started_total{game="story",country="DE",rocketcrab="false"} 1');
    expect(body).toContain(
      'ooc_game_participants_total{game="story",country="FR",rocketcrab="false"} 1',
    );
    expect(body).toContain(
      'ooc_emotes_sent_total{emote="heart",game="story",country="FR",rocketcrab="false"} 1',
    );
    // An absent game and country become explicit labels rather than dropping the sample.
    expect(body).toContain(
      'ooc_emotes_sent_total{emote="heart",game="none",country="unknown",rocketcrab="true"} 1',
    );
    expect(body).toContain(
      'ooc_reactions_total{reaction="heart",game="story",rocketcrab="false"} 1',
    );
    expect(body).toContain('ooc_sessions_total{country="DE"} 1');
    expect(body).toContain('ooc_sessions_total{country="unknown"} 1');
  });

  /**
   * Counts come in pairs, containers and people. Exposing only the container half would say three
   * games are running without saying whether that is six players or sixty. Both come off the same
   * computeServerInfo() walk, so this pins that they stay in step.
   */
  it('exposes both the container and people counts', async () => {
    const { body } = await scrape();
    for (const series of [
      'ooc_members_connected',
      'ooc_members',
      'ooc_lobbies_active{state="idle"}',
      'ooc_lobbies_active{state="waiting"}',
      'ooc_lobbies_active{state="playing"}',
      'ooc_lobby_members{state="idle"}',
      'ooc_lobby_members{state="waiting"}',
      'ooc_lobby_members{state="playing"}',
      'ooc_rocketcrab_lobbies',
      'ooc_lobby_saves',
    ]) {
      expect(body, series).toContain(series);
    }
  });

  /** Choices become labels; numbers become histogram observations - see GameConfigSettings. */
  it('labels choice settings and observes numeric ones', async () => {
    const { sink, registry } = createPrometheusMetrics();
    sink.gameStarted({
      game: 'story',
      players: 3,
      participants: [],
      rocketcrab: false,
      config: {
        choices: [{ setting: 'contextLen', value: 'three' }],
        numbers: [{ setting: 'numLinks', value: 4 }],
      },
    });

    const body = await registry.metrics();
    expect(body).toContain(
      'ooc_game_config_total{game="story",setting="contextLen",value="three"} 1',
    );
    expect(body).toContain('ooc_game_config_value_count{game="story",setting="numLinks"} 1');
    expect(body).toContain('ooc_game_config_value_sum{game="story",setting="numLinks"} 4');
    expect(body, 'config metrics carry no rocketcrab label').not.toContain(
      'setting="numLinks",rocketcrab=',
    );
    // No raw numeric label anywhere - that is the cardinality trap this split exists to avoid.
    expect(body).not.toContain('setting="numLinks",value=');
  });

  /**
   * A subscription lives as long as its SSE stream, so timing it would swamp the handler latencies
   * this histogram exists to show. It still has to be COUNTED.
   */
  /** One histogram covers every state, keyed on the state that ENDED. */
  it('labels a state duration with the state that ended', async () => {
    const { sink, registry } = createPrometheusMetrics();
    sink.playerStateEnded({
      game: 'story',
      state: 'reading',
      durationMs: 4000,
      rocketcrab: false,
    });

    const body = await registry.metrics();
    expect(body).toContain(
      'ooc_player_state_duration_seconds_count{game="story",state="reading",rocketcrab="false"} 1',
    );
  });

  it('counts a subscription but keeps it out of the latency histogram', async () => {
    const { sink, registry } = createPrometheusMetrics();
    sink.trpcRequest({
      procedure: 'lobby.onInfo',
      outcome: 'ok',
      type: 'subscription',
      durationMs: 900_000,
    });

    const body = await registry.metrics();
    expect(body).toContain('ooc_trpc_requests_total{procedure="lobby.onInfo",outcome="ok"} 1');
    expect(body).not.toContain('ooc_trpc_duration_seconds_count{procedure="lobby.onInfo"}');
  });

  /** Without an initialised sample this series is absent, and rate() over it returns nothing. */
  it('reports zero dropped emotes rather than no series at all', async () => {
    const { body } = await scrape();
    expect(body).toContain('ooc_emotes_rate_limited_total{game="none",rocketcrab="false"} 0');
  });
});
