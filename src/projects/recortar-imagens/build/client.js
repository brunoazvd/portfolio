let numSheets = 0;
let rectangles = [];
let canvas = {
    obj: null,
    height: null,
    width: null,
    scale: null,
    maxWidth: 1138,
    maxHeight: 640
};
let image = {
    url: null,
    width: null,
    height: null,
    rectWidth: null,
    rectHeight: null,
    blob: null,
    filename: null
};
let imageSlices = [];

// Helpers 
const isImageURL = (text) => {
    const validExtensions = ["jpg", "png", "webp"];
    const regex = new RegExp(`\\.(${validExtensions.join("|")})$`, "i");
    return regex.test(text);
};

const generateString = () => {
    let str = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 8; i++) {
        str += characters[Math.floor(Math.random() * characters.length)]; // Gera um número aleatório entre 0 e 9
    };
    return str;
}

const urlToBlob = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return blob;
}

// Colagem de Imagem
const handlePaste = async () => {
    try {
        const clipboardData = await navigator.clipboard.read();
        for (const item of clipboardData) {
            // Case text/plain
            if (item.types.includes("text/plain")) {
                let blob = await item.getType("text/plain");
                const textValue = await blob.text();
                if (isImageURL(textValue)) {
                    blob = await urlToBlob(textValue);
                    image.blob = blob;
                    const splits = textValue.split("/");
                    image.filename = splits[splits.length - 1];
                    setupCanvas(textValue);
                    break;
                }
            }
            // Case image/*
            if (item.types.includes('image/png') || item.types.includes('image/jpg') || item.types.includes('image/webp')) {
                for (const type of item.types) {
                    const extension = `${type.includes('png') ? '.png' : ''}${type.includes('jpg') ? '.jpg' : ''}${type.includes('webp') ? '.webp' : ''}` 
                    if (type.includes('image/')) {
                        const blob = await item.getType(type);
                        const url = URL.createObjectURL(blob);
                        image.blob = blob;
                        image.filename = generateString() + extension;                   
                        setupCanvas(url);
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.error("Erro ao ler o clipboard:", error);
    }
};
document.addEventListener("paste", handlePaste);

// Upload de Imagem
const uploadButton = document.getElementById('upload-button');
const imageUpload = document.getElementById('image-upload');
const canvasContainer = document.getElementById('canvas-container');
uploadButton.addEventListener('click', () => {
    imageUpload.click();
});
imageUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    const url = URL.createObjectURL(file);
    image.blob = file;
    image.filename = file.name;
    setupCanvas(url);
  }
});


// Canvas Setup and Rects
const setupCanvas = (url) => {
    image.url = url;
    fabric.Image.fromURL(url, (img) => {
        if (canvas.obj) {
            canvas.obj.dispose();
            canvasContainer.classList.add("hidden");
        }

        canvas.scale = Math.min(canvas.maxWidth / img.width, canvas.maxHeight / img.height);
        canvas.width = img.width * canvas.scale;
        canvas.height = img.height * canvas.scale;

        image.width = img.width;
        image.height = img.height;

        img.left = 0;
        img.top = 0;
        img.angle = 0;
        img.opacity = 1;
        img.lockMovementX = true;
        img.lockMovementY = true;
        img.lockScalingX = true;
        img.lockScalingY = true;
        img.hasBorders = false;
        img.hasControls = false;
        img.scaleX = canvas.scale;
        img.scaleY = canvas.scale;

        

        const c = new fabric.Canvas('your-canvas-id', {
            width: canvas.width,
            height: canvas.height,
            hoverCursor: "crosshair"
        });

        canvas.obj = c;


        console.log({
            "scale": canvas.scale,
            "imgWidth": img.width,
            "imgHeight": img.height,
            "canvasWidth": canvas.width,
            "canvasHeight": canvas.height
        });

        canvas.obj.add(img);
        canvas.obj.renderAll();
        uploadButton.style.display = 'none';
        canvasContainer.classList.remove("hidden");
    })

    // se todos inputs estiverem preenchidos e o usuario enviar nova imagem
    drawRectangles(numSheets);
}

const addRectangle = (x, y, width, height) => {
    let rect = new fabric.Rect({
        left: x,
        top: y,
        fill: 'transparent',
        stroke: 'red',
        strokeWidth: 1,
        width: width,
        height: height,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true
    });
    canvas.obj.add(rect);
    rectangles.push(rect);
}

const drawRectangles = (numSheets) => {
    // valvula de escape caso essa funcao seja ativada sem imagem no canvas
    if (canvas.obj === null || numSheets <= 1) {
        console.log("canvas.obj not found or numSheets <= 1");
        return  
    }

    const orientation = document.querySelector('input[name="orientation"]:checked').value;
    const direction = document.querySelector('input[name="direction"]:checked').value;

    // remove os rentagulos existentes para limpar o canvas, e do array de slices
    rectangles.forEach(rectangle => {
        canvas.obj.remove(rectangle);
    })
    imageSlices = []

    let baseRectWidth, baseRectHeight;

    // determina width e height do rect, baseado na orientacao escolhida
    // obs: foi reduzido 1cm de altura e largura para margem
    if (orientation === 'portrait') {
        baseRectWidth = 200;
        baseRectHeight = 287;
    } else {
        baseRectWidth = 287;
        baseRectHeight = 200;
    }


    // determina qual a escala
    let scaleFactor;
    if (direction === 'horizontal') {
        scaleFactor = image.width / (baseRectWidth * numSheets);
    } else {
        scaleFactor = image.height / (baseRectHeight * numSheets);
    }


    // declara o tamanho do rect para enviar para o corte posteriormente
    image.rectWidth = Math.ceil(baseRectWidth * scaleFactor);
    image.rectHeight = Math.ceil(baseRectHeight * scaleFactor);

    // cria variaveis do rect escalado para o canvas
    let canvasRectWidth = image.rectWidth * canvas.scale;
    let canvasRectHeight = image.rectHeight * canvas.scale;

    let x = 0;
    let y = 0;
  
    // calcula aonde desenhar os rects, baseado no canvas scale, e desenha posteriomeente
    if (direction === 'horizontal') {
      while (y <= canvas.height) {
        while (x <= canvas.width) {
          addRectangle(x, y, Math.min(canvasRectWidth, canvas.width - x), Math.min(canvasRectHeight, canvas.height - y));
          x += canvasRectWidth;
        }
        x = 0;
        y += canvasRectHeight;
      }
    } else {
      while (x <= canvas.width) {
        while (y <= canvas.height) {
          addRectangle(x, y, Math.min(canvasRectWidth, canvas.width - x), Math.min(canvasRectHeight, canvas.height - y));
          y += canvasRectHeight;
        }
        y = 0;
        x += canvasRectWidth;
      }
    }

    
    // calcula a posição e tamaho dos cortes, baseado no tamanho real da imagem
    x = 0;
    y = 0;
    if (direction === "horizontal") {
        while (y < image.height) {
            while (x < image.width) {
                const slice = {
                    x: x,
                    y: y,
                    width: Math.min(image.rectWidth, image.width - x),
                    height: Math.min(image.rectHeight, image.height - y)
                };
                imageSlices.push(slice);
                x += image.rectWidth;
            }
            x = 0;
            y += image.rectHeight;
        }
    } else {
        while (x < image.width) {
            while (y < image.height) {
                const slice = {
                    x: x,
                    y: y,
                    width: Math.min(image.rectWidth, image.width - x),
                    height: Math.min(image.rectHeight, image.height - y)
                };
                imageSlices.push(slice);
                y += image.rectHeight;
            }
            y = 0;
            x += image.rectWidth;
        }
    }

}

// Componente Counter + drawRectangles EventListeners
const sheetsCounterElement = document.getElementById("sheets-counter");
document.getElementById("add-btn").addEventListener("click", () => {
    numSheets += 1;
    sheetsCounterElement.textContent = numSheets;
    drawRectangles(numSheets);
})
document.getElementById("subtract-btn").addEventListener("click", () => {
    if (numSheets > 0) {
        numSheets -= 1;
        sheetsCounterElement.textContent = numSheets;
        drawRectangles(numSheets);
    }
})
document.querySelectorAll("input[type=radio]").forEach(input => {
    input.addEventListener("change", () => drawRectangles(numSheets));
})


// Submit Function, serve para zip ou pdf
const handleSubmit = async (slices) => {
    // guard clause
    if (slices.length === 0 || image.blob === null) return
    const requestId = generateString();
    const formData = new FormData();
    const orientation = document.querySelector('input[name="orientation"]:checked').value;
    const outputFormat = document.querySelector('input[name="output-format"]:checked').value;
    formData.append('image', image.blob);
    formData.append('slices', JSON.stringify(slices));
    formData.append('filename', image.filename);
    formData.append('request_id', requestId);
    formData.append('orientation', orientation);
    
    const fetchUrl = outputFormat === "pdf" ? "/upload-pdf" : "/upload-zip"
    
    fetch(fetchUrl, {
        method: "POST",
        body: formData
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${requestId}.${outputFormat}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(e => console.error('Erro:', e));
}


document.getElementById("my-form").addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit(imageSlices);
})