<script>
import Story from './Story.vue';
import Assassin from './Assassin.vue';

export default {
  props: ['game'],
  render(h) {
    return h({
      'story': Story,
      'assassin': Assassin,
    }[this.game]);
  }
};

</script>
