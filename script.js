document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("uploadButton")
    .addEventListener("click", function () {
      document.getElementById("fileInput").click(); // Klicke auf das versteckte Input-Feld
    });

  // Event Listener für die Auswahl einer Datei
  document
    .getElementById("fileInput")
    .addEventListener("change", function (event) {
      const fileName = event.target.files[0]?.name || "Keine Datei ausgewählt"; // Hole den Dateinamen
      document.getElementById("selectedFileName").textContent = fileName; // Zeige den Dateinamen an
    });

  document
    .getElementById("uploadForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const fileInput = document.getElementById("fileInput").files[0];
      if (!fileInput) {
        alert("Bitte wählen Sie eine Datei aus.");
        return;
      }

      if (fileInput.name.endsWith(".zip")) {
        handleZipFile(fileInput);
      } else if (fileInput.name.endsWith(".txt")) {
        handleTxtFile(fileInput);
      } else {
        alert("Bitte laden Sie eine .txt oder .zip Datei hoch.");
      }
    });

  function handleZipFile(file) {
    const zip = new JSZip();
    zip.loadAsync(file).then(function (zip) {
      let txtFile = null;
      zip.forEach(function (relativePath, zipEntry) {
        if (zipEntry.name.endsWith(".txt")) {
          txtFile = zipEntry;
        }
      });

      if (txtFile) {
        txtFile.async("string").then(function (content) {
          analyzeText(content);
        });
      } else {
        alert("Keine .txt Datei in der ZIP gefunden.");
      }
    });
  }

  function handleTxtFile(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target.result;
      analyzeText(text);
    };
    reader.readAsText(file);
  }

  function analyzeText(text) {
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
    const exclusionPattern = /✨\sSarah\sScheibe\s✨/g;
    const cleanedText = text.replace(exclusionPattern, "");

    const emojis = cleanedText.match(emojiRegex) || [];
    const emojiCount = {};

    emojis.forEach((emoji) => {
      if (emojiCount[emoji]) {
        emojiCount[emoji]++;
      } else {
        emojiCount[emoji] = 1;
      }
    });

    const sortedEmojis = Object.entries(emojiCount).sort((a, b) => b[1] - a[1]);

    displayResult(sortedEmojis);
  }

  function displayResult(sortedEmojis) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `<h2>Emoji Statistik</h2>`;
    if (sortedEmojis.length === 0) {
      resultDiv.innerHTML += `<p>Keine Emojis gefunden.</p>`;
      document.getElementById("myChart").style.display = "none"; // Diagramm ausblenden
      return;
    }

    // Berechnung der Gesamtsumme der Emojis
    const totalCount = sortedEmojis.reduce((sum, [, count]) => sum + count, 0);

    // Top 5 Emojis
    const topFive = sortedEmojis.slice(0, 5);
    const labels = [];
    const data = [];
    let othersCount = 0;

    // Zeige alle Emojis in der Liste an
    sortedEmojis.forEach(([emoji, count], index) => {
      resultDiv.innerHTML += `<p><span class="emoji">${emoji}</span> ${count}</p>`;
      if (index < 5) {
        labels.push(
          emoji + " (" + Math.round((count / totalCount) * 100) + "%)"
        ); // Label mit Prozent
        data.push(count); // Zähler für das Diagramm
      } else {
        othersCount += count; // Zähle die restlichen Emojis
      }
    });

    // Füge die "Sonstigen" Emojis zur Datenreihe hinzu
    if (othersCount > 0) {
      labels.push(
        "Sonstige (" + Math.round((othersCount / totalCount) * 100) + "%)"
      );
      data.push(othersCount);
    }

    // Diagramm anzeigen
    const ctx = document.getElementById("myChart").getContext("2d");
    const myChart = new Chart(ctx, {
      type: "pie", // Typ des Diagramms
      data: {
        labels: labels,
        datasets: [
          {
            label: "Emoji Verwendung",
            data: data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.9)",
              "rgba(255, 153, 99, 0.9)",
              "rgba(255, 255, 132, 0.9)",
              "rgba(153, 255, 153, 0.9)",
              "rgba(153, 204, 255, 0.9)",
              "rgba(204, 153, 255, 0.9)", // Farbe für "Sonstige"
            ],
            borderColor: "rgba(255, 255, 255, 1)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "white",
              font: {
                size: 45,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                const label = tooltipItem.label || "";
                const count = tooltipItem.raw || 0;
                return label + ": " + count + " mal verwendet";
              },
            },
            titleColor: "white", // Schriftfarbe des Tooltip-Titels
            bodyColor: "white",
            titleFont: {
              size: 45,
            },
            bodyFont: {
              size: 45,
            },
          },
        },
        elements: {
          arc: {
            borderWidth: 2, // Dicke der Ränder der Segmente
          },
        },
      },
    });
    document.getElementById("myChart").style.display = "block"; // Diagramm sichtbar machen
  }
});
