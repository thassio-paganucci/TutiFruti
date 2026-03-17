// Configuração dos segmentos da roleta
// 5 "Não foi dessa vez" e 7 prêmios
const segments = [
  { id: 0, text: "Não foi dessa vez", type: "lose", weight: 10 },
  { id: 1, text: "1 suco 1L", type: "win", weight: 2 },
  { id: 2, text: "Não foi dessa vez", type: "lose", weight: 10 },
  { id: 3, text: "Ganhe um cacho de banana", type: "win", weight: 2 },
  { id: 4, text: "Não foi dessa vez", type: "lose", weight: 10 },
  { id: 5, text: "1 kit de comida oriental", type: "win", weight: 2 },
  { id: 6, text: "Não foi dessa vez", type: "lose", weight: 10 },
  { id: 7, text: "1 água de coco 1L", type: "win", weight: 2 },
  { id: 8, text: "1 bowl de salada", type: "win", weight: 2 },
  { id: 9, text: "Não foi dessa vez", type: "lose", weight: 10 },
  { id: 10, text: "2 saladas de fruta", type: "win", weight: 2 },
  { id: 11, text: "1 Frete Grátis", type: "win", weight: 2 }
];

// Cores
const COLOR_GREEN = "#00552c";
const COLOR_BEIGE = "#faf6eb";

// Elementos do DOM
const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spin-btn');
const resultDisplay = document.getElementById('result-display');
const resultMessage = document.getElementById('result-message');

// Variáveis de estado
let currentRotation = 0;
let isSpinning = false;
let audioCtx = null;

// Inicializar a roleta
function initWheel() {
  const numSegments = segments.length;
  const anglePerSegment = 360 / numSegments;
  
  // Criar o background com conic-gradient
  let gradientStops = [];
  
  segments.forEach((segment, index) => {
    // Alternar cores
    const bgColor = index % 2 === 0 ? COLOR_GREEN : COLOR_BEIGE;
    const textColor = index % 2 === 0 ? COLOR_BEIGE : COLOR_GREEN;
    
    // Calcular ângulos para o conic-gradient
    const startAngle = index * anglePerSegment;
    const endAngle = startAngle + anglePerSegment;
    
    gradientStops.push(`${bgColor} ${startAngle}deg ${endAngle}deg`);
    
    // Criar elemento de texto
    const textEl = document.createElement('div');
    textEl.className = 'segment-text';
    textEl.style.transform = `rotate(${index * anglePerSegment}deg)`;
    
    const spanEl = document.createElement('span');
    spanEl.style.color = textColor;
    spanEl.innerText = segment.text;
    
    textEl.appendChild(spanEl);
    wheel.appendChild(textEl);
  });
  
  // Aplicar o background com offset de -15 graus para que o segmento 0 fique centralizado no topo
  wheel.style.background = `conic-gradient(from -15deg, ${gradientStops.join(', ')})`;
}

// Função para escolher o vencedor baseado nos pesos
function getRandomWinner() {
  const totalWeight = segments.reduce((sum, segment) => sum + segment.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < segments.length; i++) {
    if (random < segments[i].weight) {
      return segments[i];
    }
    random -= segments[i].weight;
  }
  return segments[segments.length - 1];
}

// Simulação de envio para o backend
async function sendResultToBackend(result) {
  console.log("Enviando resultado para o backend...", result);
  // Exemplo de integração com fetch:
  /*
  const payload = {
    prize: result.text,
    isWin: result.type === 'win',
    timestamp: new Date().toISOString()
  };
  
  try {
    await fetch('/api/save-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Erro ao salvar resultado", e);
  }
  */
}

// Inicializar áudio
function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Efeito sonoro de clique
function playClickSound() {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) {}
}

// Efeito sonoro de vitória
function playWinSound() {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (e) {}
}

// Girar a roleta
function spinWheel() {
  if (isSpinning) return;
  
  initAudio();
  
  isSpinning = true;
  spinBtn.disabled = true;
  resultDisplay.classList.add('hidden');
  resultDisplay.className = 'result-display hidden';
  
  // Escolher o vencedor
  const winner = getRandomWinner();
  
  // Calcular o ângulo alvo
  const spins = 5;
  const degreesPerSegment = 360 / segments.length;
  
  // Adicionar uma pequena variação aleatória dentro do segmento
  // O segmento tem 30 graus. Usamos variação entre -11 e +11 para não parar na linha.
  const randomOffset = (Math.random() * 22) - 11;
  
  // O segmento 0 está no topo (0 graus).
  // Para o segmento N parar no topo, a roleta deve girar de forma que seu ângulo final seja 0.
  // Como o segmento N está em (N * 30) graus, precisamos girar (360 - N * 30) graus.
  let targetMod = (360 - (winner.id * degreesPerSegment) + randomOffset) % 360;
  if (targetMod < 0) targetMod += 360;
  
  const currentMod = currentRotation % 360;
  
  let rotationToAdd = targetMod - currentMod;
  if (rotationToAdd <= 0) {
    rotationToAdd += 360;
  }
  
  currentRotation += rotationToAdd + (spins * 360);
  
  // Aplicar a rotação via CSS
  wheel.style.transform = `rotate(${currentRotation}deg)`;
  
  // Simular som de cliques durante o giro
  let clickInterval = setInterval(playClickSound, 200);
  setTimeout(() => clearInterval(clickInterval), 2000);
  setTimeout(() => {
    clickInterval = setInterval(playClickSound, 400);
  }, 2000);
  setTimeout(() => clearInterval(clickInterval), 3500);
  
  // Aguardar o fim da animação (4 segundos)
  setTimeout(() => {
    isSpinning = false;
    spinBtn.disabled = false;
    
    // Exibir resultado
    if (winner.type === 'win') {
      resultMessage.innerText = `Parabéns! Você ganhou:\n${winner.text}`;
      resultDisplay.classList.add('win');
      playWinSound();
    } else {
      resultMessage.innerText = `Que pena!\n${winner.text}.`;
      resultDisplay.classList.add('lose');
    }
    
    resultDisplay.classList.remove('hidden');
    
    // Enviar para o backend
    sendResultToBackend(winner);
    
  }, 4000);
}

// Event Listeners
spinBtn.addEventListener('click', spinWheel);

// Inicializar
initWheel();
