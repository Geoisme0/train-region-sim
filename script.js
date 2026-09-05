// Mobile Tab Switcher Logic
function switchTab(tabName) {
  if (window.innerWidth > 768) return;

  const panels = {
    upgrades: document.getElementById("panel-upgrades"),
    routes: document.getElementById("panel-routes"),
    analytics: document.getElementById("panel-analytics")
  };

  const buttons = document.querySelectorAll(".tab-btn");

  // Hide all panels
  Object.values(panels).forEach(panel => panel.classList.remove("panel-active"));

  // Remove active states from buttons
  buttons.forEach(btn => btn.classList.remove("active"));

  // Show selected panel & activate button
  if (tabName === 'upgrades') {
    panels.upgrades.classList.add("panel-active");
    buttons[0].classList.add("active");
  } else if (tabName === 'routes') {
    panels.routes.classList.add("panel-active");
    buttons[1].classList.add("active");
  } else if (tabName === 'analytics') {
    panels.analytics.classList.add("panel-active");
    buttons[2].classList.add("active");
  }
}

// Game State
let money = 1000;
const MAX_HISTORY = 40;

const regions = [
{ 
    id: 1, 
    name: "Kingston East", 
    ticketPrice: 10, 
    demand: 1.0, 
    capacity: 50, 
    riders: 0, 
    wealth: 1.2, 
    popularity: 
    1.0, district_type: 
    "residential", 
    regions_connected: [2], 
    region_unlocked: true, 
    level: 1, 
    upkeepCost: 100, 
    history: { revenue: [], demand: [], riders: [] } 
},
  { id: 2, name: "Kingston South", ticketPrice: 25, demand: 1.0, capacity: 50, riders: 0, wealth: 1.8, popularity: 1.5, district_type: "business", regions_connected: [1, 3], region_unlocked: true, level: 1, upkeepCost: 150, history: { revenue: [], demand: [], riders: [] } },
  { id: 3, name: "Kingston West", ticketPrice: 15, demand: 1.0, capacity: 50, riders: 0, wealth: 1.0, popularity: 0.8, district_type: "industrial", regions_connected: [2], region_unlocked: false, level: 1, upkeepCost: 120, history: { revenue: [], demand: [], riders: [] } }
];

function render() {
  const container = document.getElementById("regions-container");
  const graphContainer = document.getElementById("graphs-container");

  container.innerHTML = ""; 
  graphContainer.innerHTML = "";

  regions.forEach(region => {
    if (!region.region_unlocked) return;
    
    // 1. Render Region Card
    const card = document.createElement("div");
    card.className = "region";
    card.innerHTML = `
      <h3>${region.name}</h3>
      <p>Demand Multiplier: ${region.demand.toFixed(2)}x</p>
      <p>Wealth: ${region.wealth.toFixed(2)}x | Popularity: ${region.popularity.toFixed(2)}x</p>
      <p>Type: ${region.district_type} | Capacity: ${region.capacity}</p>
      <p>Riders: ${region.riders.toFixed(0)}</p>
      <p>Ticket Price: £<span id="price-${region.id}">${region.ticketPrice}</span></p>
      <input 
        type="range" 
        min="5" 
        max="100" 
        value="${region.ticketPrice}" 
        onchange="updatePrice(${region.id}, this.value)"
      />
      <button onclick="upgradeTrain(${region.id})">Upgrade Train (£${500 * (region.level + 1)})</button>
    `;
    container.appendChild(card);

    // 2. Render Graph Card
    const graphCard = document.createElement("div");
    graphCard.className = "graph-card";
    graphCard.innerHTML = `
      <h4>${region.name} - Performance</h4>
      <canvas id="canvas-${region.id}"></canvas>
      <div class="legend">
        <span class="legend-item"><span class="dot" style="background:#2b8a3e;"></span> Rev</span>
        <span class="legend-item"><span class="dot" style="background:#1c7ed6;"></span> Dem</span>
        <span class="legend-item"><span class="dot" style="background:#e8590c;"></span> Rid</span>
      </div>
    `;
    graphContainer.appendChild(graphCard);

    drawGraph(region);
  });
}

function drawGraph(region) {
  const canvas = document.getElementById(`canvas-${region.id}`);
  if (!canvas) return;

  if (canvas.width !== canvas.clientWidth) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  function drawLine(dataArray, color, maxVal) {
    if (!dataArray || dataArray.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    dataArray.forEach((val, index) => {
      const x = (index / (MAX_HISTORY - 1)) * width;
      const y = height - (val / maxVal) * (height - 10) - 5;
      if (index === 0) ctx.moveTo(x, y); 
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  drawLine(region.history.revenue, "#2b8a3e", 10000);
  drawLine(region.history.demand, "#1c7ed6", 1.0);
  drawLine(region.history.riders, "#e8590c", region.capacity);
}

function updatedemand() {
  regions.forEach(region => {
    if (!region.region_unlocked) return;
    
    let efective_price = region.ticketPrice / region.wealth;
    let target_demand = 1 - (efective_price - 5) / 45;
    target_demand = Math.max(0.05, Math.min(1.0, target_demand));
    
    let shift = (Math.random() - 0.5) * 0.05;
    region.demand += (target_demand - region.demand) * 0.1 + shift;
    region.demand = Math.max(0.05, Math.min(1.0, region.demand));

    let posriders = Math.floor(region.demand * 100 * region.popularity);
    region.riders = Math.min(region.capacity, posriders);
    
    region.history.demand.push(region.demand);
    region.history.riders.push(region.riders);
    
    if (region.history.demand.length > MAX_HISTORY) region.history.demand.shift();
    if (region.history.riders.length > MAX_HISTORY) region.history.riders.shift();
  });
  render();
}

function updatePrice(regionId, newPrice) {
  const region = regions.find(r => r.id === regionId);
  if (region) {
    region.ticketPrice = Number(newPrice);
    render();
  }
}

function upgradeTrain(regionId) {
  const region = regions.find(r => r.id === regionId);
  if (!region) return;
  const upgradeCost = 500 * (region.level + 1);
  if (money >= upgradeCost) {
    money -= upgradeCost;
    region.capacity += 10;
    region.wealth += 0.1;
    region.popularity += 0.1;
    region.level += 1;
    document.getElementById("player-money").textContent = money.toFixed(2);
    render();
  } else {
    alert("Not enough money to upgrade!");
  }
}

function runtrain() {
  regions.forEach(region => {
    if (!region.region_unlocked) return;
    let revenue = region.riders * region.ticketPrice - upkeepCost;
    money += revenue;

    region.history.revenue.push(revenue);
    if (region.history.revenue.length > MAX_HISTORY) region.history.revenue.shift();
  });

  document.getElementById("player-money").textContent = money.toFixed(2);
  render();
}

setInterval(updatedemand, 2000);
setInterval(runtrain, 2000);
render();