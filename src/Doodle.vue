<template>
  <div class="ooc-doodle">
    <ooc-timer v-if="timer > 0"
      :start="timerStart"
      :duration="timer">
    </ooc-timer>
    <sui-card>
      <sui-card-content class="container">
        <canvas ref="canvas"></canvas>
      </sui-card-content>
      <sui-card-content class="gadgets" v-if="!isReadOnly || timerStart">
        <sui-button-group>
          <sui-button :disabled="!paths.length || isReadOnly"
            icon="undo"
            @click="pressUndo"
            size="tiny"
            compact/>
        </sui-button-group>
        <span style="flex: 1"></span>
        <sui-button-group>
          <sui-button v-if="colors"
            class="icon"
            @click="thick = (thick + 1) % 3"
            size="tiny"
            compact>
            <div class="center-icon">
              <sui-icon name="circle"
                fitted
                :size="['tiny', 'small', 'standard'][thick]"/>
            </div>
          </sui-button>
        </sui-button-group>
        <span style="flex: 1"></span>
        <sui-button-group v-if="colors">
          <sui-button :icon="color == 1 ? 'circle' : ' '"
            @click="color = 1"
            size="tiny"
            compact
            color="red"/>
          <sui-button :icon="color == 2 ? 'circle' : ' '"
            @click="color = 2"
            size="tiny"
            compact
            color="yellow"/>
          <sui-button :icon="color == 3 ? 'circle' : ' '"
            @click="color = 3"
            size="tiny"
            compact
            color="green"/>
          <sui-button :icon="color == 4 ? 'circle' : ' '"
            @click="color = 4"
            size="tiny"
            compact
            color="blue"/>
          <sui-button :icon="color == 0 ? 'circle' : ' '"
            @click="color = 0"
            size="tiny"
            compact
            color="black"/>
        </sui-button-group>
        <span style="flex: 1"></span>
        <sui-button-group>
          <sui-button primary
            :disabled="!paths.length && !isReadOnly"
            @click="pressDone"
            icon="check"
            size="tiny"
            compact/>
        </sui-button-group>
      </sui-card-content>
    </sui-card>
  </div>
</template>

<style>

.ooc-doodle {
  margin: 0;
}

.ooc-doodle .container {
  padding-bottom: 100% !important;
  padding: 0;
  position: relative;
  width: 100%;
  overflow: hidden;
}

.ooc-doodle .gadgets {
  display: flex;
  padding: 8px !important;
}

.ooc-doodle canvas {
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
  background-color: white;
}

.center-icon {
  width: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<script>

import paper, { Path, Tool, PaperScope } from 'paper';

export default {
  props: ['read-only', 'image', 'colors', 'timer'],
  colors: ['black', 'red', 'yellow', 'green', 'blue'],
  data() {
    return {
      color: 0,
      width: 0,
      timerStart: 0,
      height: 0,
      timerSched: '',
      thick: 0,
      isReadOnly: this.readOnly,
      path: '',
      paths: [],
      paper: new PaperScope(),
      tool: new Tool(),
    };
  },
  methods: {
    pressUndo() {
      const [path, ] = this.paths.splice(-1, 1);
      if(path)
        path.remove();
    },
    pressDone() {
      this.$emit('save', this.paths.map(p => p.exportJSON({asString: false})));
      this.clear();
      clearTimeout(this.timerSched);
      this.timerStart = 0;
      this.isReadOnly = false;
    },
    clear() {
      this.paths.forEach(p => p.remove());
      this.paths = [];
    },
  },
  beforeDestroy() {
    clearTimeout(this.timerSched);
  },
  watch: {
    image(newImage) {
      // Select this scope
      this.paper.activate();
      // Remove old paths
      this.clear();
      // import new image
      this.paths = newImage.map(p => new Path().importJSON(JSON.stringify(p)));
    }
  },
  mounted() {
    const canvas = this.$refs.canvas;
    this.paper.setup(canvas);

    if(this.image && this.image.length) {
      this.paper.activate();
      this.paths = this.image.map(p => new Path().importJSON(JSON.stringify(p)));
    }

    if(this.isReadOnly) {
      return;
    }

    this.paper.tools.push(this.tool);
    this.paper.tool = this.tool;

    this.tool.onMouseDown = ({ point }) => {
      if(this.isReadOnly) return;

      if(!this.timerStart && this.timer) {
        this.timerStart = Date.now();
        clearTimeout(this.timerSched);
        this.timerSched = setTimeout(() => this.isReadOnly = true, this.timer * 1000);
      }

      this.path = new Path({
        segments: [point],
        strokeWidth: this.thick * 10 + 3,
        strokeCap: 'round',
        strokeColor: this.$options.colors[this.color],
      });
    };
    this.tool.onMouseDrag = ({ point }) => {
      if(this.isReadOnly || !this.path) return;
      this.path.add(point);
    };

    this.tool.onMouseUp = () => {
      if(this.isReadOnly || !this.path) return;
      this.path.simplify(5);
      this.paths.push(this.path);
    };

    this.tool.activate();
  },
};
</script>