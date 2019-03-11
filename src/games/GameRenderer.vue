<script>
import Story from './Story.vue';

export default {
  props: ['game'],
  render(h) {
    console.log('starting render of', this.game);
    h({
      'story': Story,
    }[this.game]);
  }
};

</script>
