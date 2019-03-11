module.exports = {
  story: {
    title: 'Raconteur',
    subtitle: 'Ghost Writers',
    description: 'Players contribute one line at a time to stories they only know the last line to.',
    more: 'Raconteur is inspired by improv-type games where players contribute to a story one sentence or one word at a time. ' +
      'The idea is to create unique stories from a train of thought going who knows where. Continuity is held only ' +
      'by the last line in the story, so writing with ambiguity allows for more interesting stories.',
    playTime: '10-15m',
    config: {
      players: {
        name: 'Max Players',
        text: 'Players',
        type: 'int',
        min: 2,
        max: 256,
        defaults: '#numPlayers',
      },
      numStories: {
        name: 'Story Count',
        type: 'int',
        text: 'Stories',
        min: 1,
        max: 256,
        defaults: '#numPlayers',
      },
      numLines: {
        name: 'Line Count',
        type: 'int',
        text: 'Lines',
        min: 2,
        max: 256,
        defaults: '#numPlayers',
      },
      anonymous: {
        name: 'Hide Authors',
        type: 'bool',
        text: 'Anonymous',
        defaults: 'false',
      },
    },
  },
  draw: {
    title: 'Scribble',
    subtitle: 'Drawing Conclusions',
    description: 'Players will alternate between drawing and describing the previous rounds\' output.',
    more: 'Scribble is inspired by games like Tanner Krewson\'s Drawphone, Telestrations, and Pictionary. ' +
      'Players put their minds in maximum overdrive to decipher what on earth the other players are trying ' +
      'to convey with what little space they have. At the end of the game, the pictures and descriptions ' +
      'link together to visualize what on earth everyone is thinking.',
    playTime: '10-15m',
    config: {
      players: {
        name: 'Max Players',
        text: 'Players',
        type: 'int',
        min: 2,
        max: 256,
        defaults: '#numPlayers',
      },
      numRounds: {
        name: 'Round Count',
        text: 'Rounds',
        type: 'int',
        min: 1,
        max: 256,
        defaults: '#numPlayers',
      },
      timeLimit: {
        name: 'Time Limit',
        text: 'Time Limit',
        type: 'list',
        defaults: 'none',
        options: [{
          name: 'none',
          text: 'None',
          value: 0,
        }, {
          name: 'sec5',
          text: '5 sec',
          value: 5,
        }, {
          name: 'sec15',
          text: '15 sec',
          value: 15,
        }, {
          name: 'sec30',
          text: '30 sec',
          value: 30,
        }, {
          name: 'min1',
          text: '1 min',
          value: 60,
        }, {
          name: 'min2',
          text: '2 min',
          value: 120,
        }, {
          name: 'min5',
          text: '5 min',
          value: 300,
        }],
      },
    },
  },
  assassin: {
    title: 'Wurderer',
    subtitle: 'Murdered by Words',
    description: 'Players are each given a target and a word they need to get their targets to say.',
    more: 'Wurderer is inspired the assassin game in hopes to create a game that can be played over the ' +
      'course of multiple days. This website only orchestrates setting up the game by giving players the ' +
      'words they need to get their target to say. Players will have to handle passing their words off ' +
      'to whoever killed them on their own.',
    playTime: '4+hr',
    config: {
      players: {
        name: 'Max Players',
        text: 'Players',
        type: 'int',
        min: 2,
        max: 256,
        defaults: '#numPlayers',
      },
      numRounds: {
        name: 'Word Count',
        text: 'Words',
        type: 'int',
        min: 1,
        max: 5,
        defaults: 2,
      },
    },
  },
  locations: {
    title: 'Underground',
    subtitle: 'Where are you?',
    description: 'One hidden player is trying to figure out where everyone is while avoiding other players\' questioning.',
    more: 'Underground is inspired by hidden role games like Spyfall where everyone is looking for the one player that ' +
      'lying their way to victory.',
    playTime: '10m',
    config: {
      players: {
        name: 'Max Players',
        text: 'Players',
        type: 'int',
        min: 3,
        max: 10,
        defaults: '#numPlayers',
      },
      locationSet: {
        name: 'Location Set',
        text: 'Locations',
        type: 'list',
        options: [{
          name: 'campus',
          text: 'Campus',
          value: [
            'Atrium',
            'Basketball Gym',
            'Bowling Alley',
            'Cafe',
            'Chemistry Lab',
            'Classroom',
            'Commons',
            'Dorm',
            'Electrical Closet',
            'Faculty Office',
            'Frat House',
            'Lawn',
            'Library',
            'Machine Shop',
            'Music Room',
            'Nurse\'s Office',
            'Parking Lot',
            'Patio',
            'Police Station',
            'Sports Field',
            'Statue',
            'Swimming Pool',
            'Theatre',
            'Weights Gym',
          ],
        }],
        defaults: 'campus',
      },
    },
  },
};