if (typeof $ === "undefined") {
  console.error("jQuery n'est pas chargé !");
} else {
  console.log("jQuery est chargé !");
}




$(document).ready(function () {
  // Changement de vue
  $(".tab-link").click(function () {
    $(".tab-link, .view").removeClass("active");
    $(this).addClass("active");
    $("#" + $(this).data("target")).addClass("active");
  });

  // Fonction pour ouvrir et fermer le modal
  function openModal() {
    $("#filterModal, #overlay").addClass("open");
    $("body").addClass("modal-open");
  }

  function closeModal() {
    $("#filterModal, #overlay").removeClass("open");
    $("body").removeClass("modal-open");
  }

  $(".filter-btn").click(openModal);
  $(".close, .modal-validate").click(closeModal);

  $(document).keydown(function (event) {
    if (event.key === "Escape") closeModal();
  });

  // Affichage du menu popup
  $("#menu-toggle").click(function (event) {
    event.stopPropagation();
    console.log('fdfffffffffffff')
    $("#popup-menu").toggle();
  });

  // Affichage ou masquage du popup de profil
  $("#profile-icon").click(function (event) {
    event.stopPropagation();
    $("#profile-popup").toggle();
  });

  // Fermer les menus en cliquant ailleurs
  $(document).click(function (event) {
    if (!$(event.target).closest("#popup-menu, #menu-toggle").length) {
      $("#popup-menu").hide();
    }
    if (!$(event.target).closest("#profile-popup, #profile-icon").length) {
      $("#profile-popup").hide();
    }
  });

  // Filtrage du menu de recherche
  $("#search-input").on("input", function () {
    let searchValue = $(this).val().toLowerCase();
    let found = false;

    $(".menu-item").each(function () {
      let itemName = $(this).data("name").toLowerCase();
      if (itemName.includes(searchValue)) {
        $(this).show();
        found = true;
      } else {
        $(this).hide();
      }
    });

    $("#no-results").toggle(!found);
  });

  // Appliquer le filtre sur le tableau
  $("#modal-validate").click(function () {
    let filterValue = $("#filterName").val().toLowerCase();
    let total = 0, sum = 0, count = 0;

    $("#table-body tr").each(function () {
      let productName = $(this).children().eq(1).text().toLowerCase();
      let value = parseFloat($(this).children().eq(2).text());

      if (productName.includes(filterValue) || filterValue === "") {
        $(this).show();
        total++;
        sum += value;
        count++;
      } else {
        $(this).hide();
      }
    });

    $("#totalItems").text(total);
    $("#averageValue").text(count ? (sum / count).toFixed(2) : "0");
  });

  // Initialisation du graphique
  if ($("#chartCanvas") && $("#chartCanvas")[0]) {
    let ctx = $("#chartCanvas")[0].getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Produit A", "Produit B", "Produit C"],
        datasets: [{
          label: "Valeurs",
          data: [100, 200, 150],
          backgroundColor: ["red", "blue", "green"]
        }]
      }
    });
  }

  // Export CSV
  function exportToCSV() {
    let csvContent = $("#data-table tr").map(function () {
      return $(this).find("td, th").map(function () {
        return $(this).text();
      }).get().join(",");
    }).get().join("\n");

    let blob = new Blob([csvContent], { type: "text/csv" });
    let link = $("<a>").attr({
      href: URL.createObjectURL(blob),
      download: "data.csv"
    })[0];

    link.click();
  }

  // Export JSON
  function exportToJSON() {
    let data = $("#data-table tr").slice(1).map(function () {
      let cells = $(this).find("td");
      return {
        ID: cells.eq(0).text(),
        Nom: cells.eq(1).text(),
        Valeur: cells.eq(2).text()
      };
    }).get();

    let jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    let link = $("<a>").attr({
      href: URL.createObjectURL(jsonBlob),
      download: "data.json"
    })[0];

    link.click();
  }

  // Export Excel
  function exportToExcel() {
    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.table_to_sheet($("#data-table")[0]);
    XLSX.utils.book_append_sheet(wb, ws, "Données");
    XLSX.writeFile(wb, "data.xlsx");
  }

  // Export PDF
  function exportToPDF() {
    let doc = new jsPDF();
    doc.text("Données Exportées", 20, 10);

    let data = $("#data-table tr").map(function () {
      return $(this).find("td, th").map(function () {
        return $(this).text();
      }).get();
    }).get();

    doc.autoTable({ head: [data[0]], body: data.slice(1) });
    doc.save("data.pdf");
  }
});
