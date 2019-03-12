<script>
import Story from './Story.vue';

export default {
  props: ['game'],
  render(h) {
    return h({
      'story': Story,
    }[this.game]);
  }
};

</script>
