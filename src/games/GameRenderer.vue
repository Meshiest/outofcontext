<script>
import Story from './Story.vue';
import Assassin from './Assassin.vue';
import Locations from './Locations.vue';

export default {
  props: ['game'],
  render(h) {
    return h({
      'story': Story,
      'assassin': Assassin,
      'locations': Locations,
    }[this.game]);
  }
};

</script>
