function savePreset(presetId, presetName, presetState) {
  const data = {
    psave: presetId,
    n: presetName,
    o: true, // Überschreiben des Presets, falls es bereits existiert
    seg: presetState.seg,
    on: presetState.on,
    bri: presetState.bri,
  };

  fetch(`http://${wledIp}/json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Preset saved:", data);
    })
    .catch((error) => {
      console.error("Error saving preset:", error);
    });
}

// Beispielaufruf: Preset speichern
const presetId = 15;
const presetName = "My Preset";
const presetState = {
  seg: [{ id: 0, col: [[255, 0, 0]], fx: 0, sx: 128, ix: 128 }],
  on: true,
  bri: 128,
};

savePreset(presetId, presetName, presetState);

//

function displaySegmentData() {
  fetch(`http://${wledIp}/json/state`)
    .then((response) => response.json())
    .then((data) => {
      const segment = data.seg[0];
      document.getElementById("segment-id").textContent = segment.id;
      document.getElementById(
        "color"
      ).textContent = `rgb(${segment.col[0][0]}, ${segment.col[0][1]}, ${segment.col[0][2]})`;
      document.getElementById("effect").textContent = segment.fx;
      document.getElementById("effect-speed").textContent = segment.sx;
      document.getElementById("intensity").textContent = segment.ix;
      document.getElementById("on-state").textContent = data.on ? "On" : "Off";
      document.getElementById("brightness").textContent = data.bri;
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}
displaySegmentData();
