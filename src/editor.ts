/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import {
  LitElement,
  html,
  customElement,
  property,
  TemplateResult,
  CSSResult,
  css,
  internalProperty,
} from 'lit-element';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { DogCardConfig } from './types';

@customElement('dog-card-editor')
export class DogCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @internalProperty() private _config?: DogCardConfig;
  @internalProperty() private _toggle?: boolean;
  @internalProperty() private _helpers?: any;
  private _initialized = false;

  public setConfig(config: DogCardConfig): void {
    this._config = config;

    this.loadCardHelpers();
  }

  protected shouldUpdate(): boolean {
    if (!this._initialized) {
      this._initialize();
    }

    return true;
  }

  get _name(): string {
    return this._config?.name || '';
  }

  get _entity_device_tracker(): string {
    return this._config?.entity_device_tracker || '';
  }

  get _entity_battery(): string {
    return this._config?.entity_battery || '';
  }

  get _entity_light(): string {
    return this._config?.entity_light || '';
  }

  get _entity_lost_dog(): string {
    return this._config?.entity_lost_dog || '';
  }

  get _entity_steps(): string {
    return this._config?.entity_steps || '';
  }

  get _step_goal(): number {
    return this._config?.step_goal || 0;
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._helpers) {
      return html``;
    }

    return html`
      <div class="card-config">
        <ha-entity-picker
          label="Device Tracker (required)"
          .hass=${this.hass}
          .value="${this._entity_device_tracker}"
          .configValue=${'entity_device_tracker'}
          .includeDomains=${['device_tracker']}
          @change="${this._valueChanged}"
          allow-custom-entity
        ></ha-entity-picker>
        <ha-entity-picker
          label="Battery Sensor (required)"
          .hass=${this.hass}
          .value="${this._entity_battery}"
          .configValue=${'entity_battery'}
          .includeDomains=${['sensor']}
          @change="${this._valueChanged}"
          allow-custom-entity
        ></ha-entity-picker>
        <ha-entity-picker
          label="Collar Light Switch"
          .hass=${this.hass}
          .value="${this._entity_light}"
          .configValue=${'entity_light'}
          .includeDomains=${['light']}
          @change="${this._valueChanged}"
          allow-custom-entity
        ></ha-entity-picker>
        <ha-entity-picker
          label="Lost Dog Toggle"
          .hass=${this.hass}
          .value="${this._entity_lost_dog}"
          .configValue=${'entity_lost_dog'}
          .includeDomains=${['lock']}
          @change="${this._valueChanged}"
          allow-custom-entity
        ></ha-entity-picker>
        <ha-entity-picker
          label="Daily Steps Sensor"
          .hass=${this.hass}
          .value="${this._entity_steps}"
          .configValue=${'entity_steps'}
          .includeDomains=${['sensor']}
          @change="${this._valueChanged}"
          allow-custom-entity
        ></ha-entity-picker>
        <paper-input
          label="Daily Goal Steps (Optional)"
          .value=${this._step_goal}
          .configValue=${'step_goal'}
          @value-changed=${this._valueChanged}
        ></paper-input>
        <paper-input
          label="Name (Optional)"
          .value=${this._name}
          .configValue=${'name'}
          @value-changed=${this._valueChanged}
        ></paper-input>
      </div>
    `;
  }

  private _initialize(): void {
    if (this.hass === undefined) return;
    if (this._config === undefined) return;
    if (this._helpers === undefined) return;
    this._initialized = true;
  }

  private async loadCardHelpers(): Promise<void> {
    this._helpers = await (window as any).loadCardHelpers();
  }

  private _valueChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        const tmpConfig = { ...this._config };
        delete tmpConfig[target.configValue];
        this._config = tmpConfig;
      } else {
        this._config = {
          ...this._config,
          [target.configValue]: target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static get styles(): CSSResult {
    return css`
      .option {
        padding: 4px 0px;
        cursor: pointer;
      }
      .row {
        display: flex;
        margin-bottom: -14px;
        pointer-events: none;
      }
      .title {
        padding-left: 16px;
        margin-top: -6px;
        pointer-events: none;
      }
      .secondary {
        padding-left: 40px;
        color: var(--secondary-text-color);
        pointer-events: none;
      }
      .values {
        padding-left: 16px;
        background: var(--secondary-background-color);
        display: grid;
      }
      ha-formfield {
        padding-bottom: 8px;
      }
    `;
  }
}
