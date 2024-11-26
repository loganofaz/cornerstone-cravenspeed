const getVehicles = () => {
  console.log("Getting vehicles");

  const paramsVehicle = getParamsVehicle();
  const cookieVehicle = getCookieVehicle();

  return { 'paramsVehicle': paramsVehicle, 'cookieVehicle': cookieVehicle};
};

function getParamsVehicle() {
  const params = new URLSearchParams(window.location.search);
  const make = params.get('make') || '';
  const model = all_makes.includes(make) ? params.get('model') || '' : '';
  const gen = model ? params.get('year') || '' : '';

  return { make, model, gen };
}

function getCookieVehicle() {
  return {
    make: getCookie('make') || '',
    model: getCookie('model') || '',
    gen: getCookie('gen') || '',
  };
}

function getCookie(name) {
  const match = document.cookie.split('; ').find(cookie => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : '';
}

export default getVehicles;
