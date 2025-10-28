import PageManager from '../page-manager';
import { CDN_ROOT, CATEGORY_ROOT } from './product/constants';
import inStockNotifyForm from './product/inStockNotify';
import CsGallery from './product/csGallery';

export default class Product extends PageManager {

  #elementKeys = [
    'badges', 'blemForm', 'brand', 'description', 'fitmentNotes',
    'instructions', 'messages', 'more', 'moreHeader', 'price',
    'shipping', 'sku', 'slides', 'stock', 'title',
  ];
  contentElements = {};

  titleData = null;
  isArchetype = false;
  qtyDataUrl = null;
  gallery = null;
  aliasVehicle = null;

  constructor(context) {
    super(context);
  }

  async onReady() {
    this.#populateContentElements();
    this.titleData = this.contentElements.title.dataset;
    this.isArchetype = this.titleData.productCategory === CATEGORY_ROOT;
    this.qtyDataUrl = this.#buildArchetypeDataUrl();

    this.gallery = new CsGallery();

    // Add the Qty Data Script to the page
    try {
      await this.#loadQtyScript();
    } catch (error) {
      console.error(error);
    }

    if (!this.isArchetype && !universal_product) { this.aliasVehicle = this.#parseVehicleString(this.titleData.productTitle) };

    console.log('last update:', last_update);
    console.log('alias vehicle:', this.aliasVehicle);
  }

  #populateContentElements() {
    this.contentElements = this.#elementKeys.reduce((acc, key) => {
      const id = 'product-' + key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      acc[key] = document.getElementById(id);
      return acc
    }, {})
  }

  #buildArchetypeDataUrl() {

    const getArchetypeString = (title) => {
      const separator = ' for ';
      const lastIndex = title.lastIndexOf(separator);
      return (lastIndex === -1) ? title : title.slice(0, lastIndex);
    }

    const archetypeTitleString = this.isArchetype ? this.titleData.productTitle : getArchetypeString(this.titleData.productTitle);
    const archetypeUrlSnippet = archetypeTitleString.toLowerCase().replace(/ /g, '-');
    return CDN_ROOT + archetypeUrlSnippet + '.js';
  }

  #loadQtyScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this.qtyDataUrl;
      script.type = 'text/javascript';
      script.async = true;

      script.onload = () => {
        resolve();
      }

      script.onerror = () => {
        reject(new Error(`Failed to load Qty data script: ${this.qtyDataUrl}`));
      }

      document.body.appendChild(script);
    })
  }

  #parseVehicleString(title) {
    const findLongestMatch = (searchString, candidates, key) => {
      if (!searchString || !Array.isArray(candidates) || candidates.length === 0) {
        return null;
      }

      const matches = candidates.filter(candidate => {
        const name = key ? candidate[key] : candidate;
        return searchString.startsWith(name);
      });

      if (matches.length === 0) {
        return null;
      }

      return matches.reduce((best, current) => {
        const bestName = key ? best[key] : best;
        const currentName = key ? current[key] : current;
        return currentName.length > bestName.length ? current : best;
      });
    };
    const vehicleString = title.replace(og_name + ' for ', '').trim();
    const make = findLongestMatch(vehicleString, make_data);
    const modelGenString = vehicleString.replace(make, '').trim();
    const model = findLongestMatch(modelGenString, model_data[make]);
    const genString = modelGenString.replace(model, '').replace(' to ', '-').trim();
    const bestGenMatch = findLongestMatch(genString, gen_data[model], 'name');
    const gen = bestGenMatch ? bestGenMatch.index : null;
    const sku = this.contentElements.sku.dataset.productSku;

    return { make, model, gen, sku };
  }
}
