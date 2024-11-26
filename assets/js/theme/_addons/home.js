import PageManager from '../page-manager';
import CsGallery from './common/csGallery';
import getVehicles from './common/utils/getVehicles';

export default class Home extends PageManager {
  constructor(context) {
    console.log('home page');
    // import some BC settings via the page manager class
    super(context);

    this.matchedProductsElement = document.querySelector('.cs-product-collection');
    this.vehicleSelectionElement = document.querySelector('.cs-car-picker');
    this.vehicleChangeHandler = this.handleVehicleChange.bind(this);

    // set the vehicle context for the page upon which rendering will be based on
    this.vehicle = {
      make: '',
      model: '',
      year: '',
    };

    // create the vehicle selects and assign their properties. A data property is added for each select after the data has been loaded by cs_search_data.js
    this.vehicleSelects = {
      make: {
        element: document.querySelector('#Make'),
        defaultOption: "Select Make"
      },
      model: {
        element: document.querySelector('#Model'),
        defaultOption: "Select Model"
      },
      gen: {
        element: document.querySelector('#Gen'),
        defaultOption: "Select Year"
      },
    };
  }

  onReady() {
    console.log('onReady');
    this.listenForVehicleData();
    this.vehicleSelectionElement.addEventListener('change', this.vehicleChangeHandler);
  }

  // set up the listener for the vehicle data being ready
  listenForVehicleData() {
    console.log('listening for data ready');

    // the csVehicleData event is dispatched by cs_search_data.js
    document.addEventListener('csVehicleData', this.handleDataReady.bind(this));
  }

  handleVehicleChange(event) {
    let changedValue = event.target.id;

    if (changedValue) {
      switch (changedValue) {
        case 'Make':
          console.log("make changed")
          const selectedMake = this.vehicleSelects.make.element.value;
          this.vehicle = {
            make: selectedMake,
            model: '',
            gen: ''
          }

          this.initVehicleSelction(this.vehicle);
          break

        case 'Model':
          console.log("model changed")
          const selectedModel = this.vehicleSelects.model.element.value;
          this.vehicle.model = selectedModel;
          this.vehicle.gen = '';

          this.initVehicleSelction(this.vehicle);
          break

        case 'Gen':
          console.log("gen changed");
          const selectedGen = this.vehicleSelects.gen.element.value;
          this.vehicle.gen = selectedGen;

          this.initVehicleSelction(this.vehicle);
          break

        default:
          console.warn('changed element unknown');
      }
    }
  }

  // do this when csVehicleData is heard
  handleDataReady() {
    console.log('data ready');

    // pass the vehicle make, model, year data to the selects
    this.vehicleSelects.make.data = all_makes;
    this.vehicleSelects.model.data = make_model;
    this.vehicleSelects.gen.data = model_gen;

    // once the vehicle data is loaded continue rendering the page
    this.init();
  }

  init() {
    // check the params and cookie for vehicle info
    let vehicles = getVehicles();
    console.log(vehicles);
    const { paramsVehicle, cookieVehicle } = vehicles;

    // check if any vehicle info was returned from the params or the cookie
    const paramsPartialTrue = Object.values(paramsVehicle).some(
      (value) => value != ''
    );
    const cookiePartialTrue = Object.values(cookieVehicle).some(
      (value) => value != ''
    );

    this.renderAllProducts();

    // if there is vehicle info in params, render with that info, else do the same with the cookie, else just load with no vehicle
    if (paramsPartialTrue) {
      console.log('params partial true');

      // set the vehicle context of the page using the params vehicle
      this.vehicle = paramsVehicle;

      // render the page with the params vehicle
      this.renderVehicleProducts(this.vehicle);
    } else if (cookiePartialTrue) {
      // set the vehicle context of the page using the cookie vehicle
      this.vehicle = cookieVehicle;

      // render the page with the cookie vehicle
      this.renderVehicleProducts(this.vehicle);
    } else {
      // render the page with no vehicle
      this.renderVehicleProducts(this.vehicle);
    }

    // render the reviews
  }

  // setup the vehicle selections based on the initial vehicle context
  initVehicleSelction(vehicle) {
    const { make, model, gen } = vehicle;
    
    // progress through each tier of the vehicle and create the applicable drop down if the property is known
    // if (make) {
    //   this.createOptions('make', make);
    // }

    this.createOptions('make', make);

    if (model) {
      this.createOptions('model', model);
    }
    if (gen) {
      this.createOptions('gen', gen);
    }
  }
  
  renderAllProducts() {
    console.log('render all products');
    let slidesContainer = this.matchedProductsElement.querySelector('.slides');
    let cards = [];
    slidesContainer.innerHTML = '';

    for (const product of search_string) {
      const card = this.createProductCard(product);
      cards.push(card);
    }

    slidesContainer.append(...cards);

    let productCollection = new CsGallery ({
      containerClass: 'cs-product-collection',
      visibleSlides: 3,
      type: 'collection',
      modal: false
    });
  }

  // once vehicle context is known render the relevant products
  renderVehicleProducts(vehicle) {
    console.log('render page with vehicle: ', vehicle);
    this.initVehicleSelction(vehicle);
  }

  createProductCard(product) {
    const { url, title, arch_price: price, search_image_url: imageUrl, arch_id: id } = product;

    const card = document.createElement('a');
    const photoEl = document.createElement('img');
    const titleEl = document.createElement('h3');
    const ratingEl = document.createElement('div');
    const priceEl = document.createElement('div');

    card.href = url;
    card.classList.add('slide');
    photoEl.src = imageUrl;
    titleEl.innerHTML = title;
    ratingEl.setAttribute('data-rating-id', id);
    priceEl.innerHTML = price;
    
    card.append(photoEl, titleEl, ratingEl, priceEl);

    return card;
  }

  // Create all options for the select element and select the appropriate option if applicable. 
  // [args: (select) the select object to create options for, (selected) the option that should be selected]
  createOptions(select, selected) {

    // destructure the select
    const { data, element, defaultOption } = this.vehicleSelects[select];

    // break off the appropriate chunk of data for the options
    const optionsData = this.getOptionsData(select, data);

    // Clear previous options
    element.innerHTML = `<option>${defaultOption}</option>`;

    // Create and append options
    optionsData.forEach((item) => {
      const option = this.createOption(item.name, item.value);
      element.append(option);
    });

    // Set the selected option
    if (selected) {
      element.value = selected;
    }
  }

  // Get the appropriate data for the select dropdown based on its type and return it in a consistent format
  // [args: (select) tells the function which select the option is being created for, (data) the option data to use]
  getOptionsData(select, data) {
    switch (select) {
      case 'make':
        return data.map((make) => ({ name: make, value: make }));
      case 'model':
        return (data[this.vehicle.make] || []).map((model) => ({
          name: model,
          value: model,
        }));
      case 'gen':
        return (data[this.vehicle.model] || []).map((gen) => ({
          name: gen.name,
          value: gen.value,
        }));
      default:
        return [];
    }
  }

  // Create a single option for the provided item 
  // [args: (name) the innterHTML of the option, (value) the value of the value attribute of the option element]
  createOption(name, value) {
    return Object.assign(document.createElement('option'), {
      innerHTML: name,
      value: value || name, // Set value to name if value is undefined
    });
  }
}
