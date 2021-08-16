import { LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'dog-card-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

// TODO Add your configuration elements here for type-checking
export interface DogCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  entity_device_tracker?: string;
  entity_battery?: string;
  entity_light?: string;
  entity_lost_dog?: string;
  entity_steps?: string;
  step_goal?: number;
}
