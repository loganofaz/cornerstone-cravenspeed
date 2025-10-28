import PageManager from '../page-manager';
import { CDN_ROOT } from './product/constants'; 
import inStockNotifyForm from './product/inStockNotify';
import CsGallery from './product/csGallery';

export default class Product extends PageManager {

  titleData = document.querySelector('h1').dataset; //Gets some properties of the BigCommerce product from the product template
  isArchetype = this.titleData.productCategory === 'Qty - All Products'; //the category string if the page is an archetype page 
  qtyDataUrl = this.#buildArchetypeDataUrl();
  gallery = null;

  constructor(context) {
    super(context);
  }

  async onReady() {
    this.gallery = new CsGallery();

    // Add the Qty Data Script to the page
    try {
      await this.#loadQtyScript();
    } catch (error) {
      console.error(error);
    }

    console.log('last update:', last_update);
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
}
