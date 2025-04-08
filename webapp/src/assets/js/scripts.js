  $(document).ready(function () {
      function openModal() {
        $(".absolute-fix-modal, .modal-backdrop").fadeIn(300);
      }

      function closeModal() {
        $(".absolute-fix-modal, .modal-backdrop").fadeOut(300);
      }

      // Ouvrir la modal au clic sur un bouton
      $(".open-modal-backdrop").on("click", openModal);

      // Fermer la modal au clic sur le bouton de fermeture
      $(".close-modal-backdrop").on("click", closeModal);

      // Fermer la modal en cliquant sur l'overlay
      $(".modal-backdrop").on("click", closeModal);
  });
  


  // $(document).ready(function () {
  //   $("#close-modal, .close").on("click", function () {
  //     $(".modal-backdrop, .absolute-fix-modal-top").fadeOut(300);
  //   });
  
  //   $(document).on("click", function (event) {
  //     if ($(event.target).closest(".absolute-fix-modal-top").length === 0 &&
  //         $(event.target).closest(".btn-info").length === 0) {
  //       $(".modal-backdrop, .absolute-fix-modal-top").fadeOut(300);
  //     }
  //   });
  // });
  