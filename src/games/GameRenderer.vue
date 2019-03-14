<script>
import Story from './Story.vue';
import Assassin from './Assassin.vue';
import Locations from './Locations.vue';
import Draw from './Draw.vue';

export default {
  props: ['game'],
  render(h) {
    return h({
      'story': Story,
      'assassin': Assassin,
      'locations': Locations,
      'draw': Draw,
    }[this.game]);
  }
};

</script>
