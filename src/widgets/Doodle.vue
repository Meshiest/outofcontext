<template>
  <div class="ooc-doodle">
    <ooc-timer v-if="timer > 0"
      :start="timerStart"
      :duration="timer">
    </ooc-timer>
    <sui-card>
      <sui-card-content :class="['container', {'show-author': !!author}]" :data-author="author">
        <canvas ref="canvas"></canvas>
      </sui-card-content>
      <sui-card-content class="gadgets" v-if="!isReadOnly || timerStart">
        <sui-button-group>
          <sui-button :disabled="!paths.length || isReadOnly"
            icon="undo"
            @click="pressUndo"
            size="tiny"
            label-position="left"
            compact
            content="Undo"
          />
        </sui-button-group>
        <span style="flex: 1"></span>
        <sui-button-group>
          <sui-button primary
            :disabled="!paths.length && !isReadOnly || disabled"
            @click="pressDone"
            label-position="right"
            content="Done"
            icon="check"
            size="tiny"
            compact />
        </sui-button-group>
      </sui-card-content>
      <sui-card-content class="ui form gadget-config" v-if="colors">
        <sui-form-field>
          <label>Color</label>
          <div class="color-grid">
            <div v-for="col in palette" class="color"
              :key="col"
              :style="{backgroundColor: col}"
              @click="color = col"
            >
              <div class="selected-color" v-if="color === col" />
            </div>
          </div>
        </sui-form-field>
        <sui-form-field>
          <label>Stroke Width</label>
          <div class="slider-container">
            <input class="slider"
              type="range"
              min="3"
              :step="27/4"
              max="30"
              :value="thick"
              @input="thick=$event.target.value" />
            <div class="slider-dots">
              <div v-for="n in 5"
                :key="n"
                class="dot"
                :style="{transform: `scale(${(n+1)/8})`}" />
            </div>
          </div>
        </sui-form-field>
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

.ooc-doodle .container.show-author::before {
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  content: attr(data-author);
  display: flex;
  height: 20px;
  justify-content: center;
  padding: 4px;
  position: absolute;
  right: 4px;
  top: 4px;
  z-index: 5;
  border-radius: 4px;
  opacity: 0.05;
  animation: author-fade-out 2s 1 linear;
  transition: opacity .1s ease;
}

@keyframes author-fade-out {
  0% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0.05;
  }
}

.ooc-doodle:hover .container.show-author::before {
  opacity: 1;
}

.ooc-doodle .gadget-config {
  padding: 8px !important;
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

.gadget-config .slider-container {
  width: 200px;
  height: 30.5px;
  margin: 0 auto;
  position: relative;
}

.gadget-config .slider-dots {
  display: flex;
  position: absolute;
  padding: 2px;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
}

.gadget-config .slider-dots .dot {
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  width: 26px;
  height: 26px;
}

.gadget-config .slider {
  -webkit-appearance: none;
  appearance: none;
  width: 200px;
  height: 30.5px;
  background: rgb(224, 225, 226);
  padding: 0 2px;
  border-radius: 15.25px;
  outline: none;
  -webkit-transition: .2s;
  transition: opacity .2s;
}

.dark-theme .gadget-config .slider {
  box-shadow: 0 1px 3px 0 #444, 0 0 0 1px #444 !important;
}

.dark-theme .gadget-config label {
  color: rgba(255,255,255,.9) !important;
}

.gadget-config .slider::-webkit-slider-thumb:hover {
  filter: brightness(95%);
}

.gadget-config .slider::-webkit-slider-thumb:active {
  filter: brightness(85%);
}

.gadget-config .slider::-moz-slider-thumb:hover {
  filter: brightness(95%);
}

.gadget-config .slider::-moz-slider-thumb:active {
  filter: brightness(85%);
}

.gadget-config .slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 26.5px;
  height: 26.5px;
  border-radius: 50%;
  background: rgb(33, 133, 208);
  cursor: pointer;
}

.gadget-config .slider::-moz-range-thumb {
  width: 26.5px;
  height: 26.5px;
  border-radius: 50%;
  background: rgb(33, 133, 208);
  cursor: pointer;
}

.color-grid {
  display: inline-grid;
  grid-template-rows: repeat(2, 30.5px);
  grid-template-columns: repeat(7, 30.5px);
  align-items: stretch;
  overflow: hidden;
  border-radius: 5px;
  box-shadow: 0 1px 3px 0 #eee, 0 0 0 1px #eee !important;
}

.dark-theme .color-grid {
  box-shadow: 0 1px 3px 0 #444, 0 0 0 1px #444 !important;
}

.color-grid .color {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-grid .selected-color {
  border-radius: 50%;
  width: 15px;
  height: 15px;
  background-color: #eee;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.color-grid .color:hover {
  filter: brightness(95%);
}

.color-grid .color:active {
  filter: brightness(85%);
}

</style>

<script>

import paper, { Path, Tool, PaperScope } from 'paper';

// maximum number of segments that can be drawn
const MAX_SEGMENTS = 2000;

export default {
  props: ['read-only', 'image', 'colors', 'timer', 'disabled', 'author'],
  data() {
    return {
      palette: [
        'black',
        'grey',
        'white',
        'brown',
        'tan',
        'red',
        'orange',
        'yellow',
        'green',
        'cyan',
        'navy',
        'blue',
        'purple',
        'pink',
      ],
      color: 'black',
      width: 0,
      timerStart: 0,
      height: 0,
      timerSched: '',
      thick: 3,
      isReadOnly: this.readOnly,
      path: '',
      paths: [],
      paper: new PaperScope(),
      tool: new Tool(),
    };
  },
  methods: {
    pressUndo() {
      const path = this.paths.pop();
      if(path)
        path.remove();
      if (this.timerStart && this.paths.length === 0) {
        this.timerStart = 0;
        clearTimeout(this.timerSched);
      }
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
        strokeWidth: this.thick,
        strokeCap: 'round',
        strokeColor: this.color,
      });
    };
    this.tool.onMouseDrag = ({ point }) => {
      if(this.isReadOnly || !this.path) return;
      this.path.add(point);
    };

    this.tool.onMouseUp = ({ point }) => {
      if(this.isReadOnly || !this.path) return;
      if (this.path.length === 0)
        this.path.add(point);
      else
        this.path.simplify(5);
      this.paths.push(this.path);

      // automatically remove paths in excess
      let sum;
      do {
        sum = 0;
        for (const path of this.paths) {
          sum += path.segments.length;
        }
        if (sum > MAX_SEGMENTS) {
          const [path] = this.paths.splice(0, 1);
          path.remove();
        }
      } while(sum > MAX_SEGMENTS);
    };

    this.tool.activate();
  },
};
</script>