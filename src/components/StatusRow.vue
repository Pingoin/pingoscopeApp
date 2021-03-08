<template>
  <div class="row justify-center">
    <div class="col">
      {{ caption }}
    </div>
    <div class="col">
      {{ status }}
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class StatusRow extends Vue {
  @Prop() private status!: string;
  @Prop() private caption!: string;
}
</script>
