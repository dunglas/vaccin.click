(async function () {
  if (window.vaccinClickBookHasRun) return;
  window.vaccinClickBookHasRun = true;

  // Sauvegarde de l'URL originale, avant que l'on change de page
  const url = document.URL;

  const MONTHS = {
    janvier: 1,
    fevrier: 2,
    mars: 3,
    avril: 4,
    mai: 5,
    juin: 6,
    juillet: 7,
    aout: 8,
    septembre: 9,
    octobre: 10,
    novembre: 11,
    decembre: 12,
  };

  async function waitTimeout(timeout) {
    await new Promise((r) => setTimeout(r, timeout));
  }

  async function waitForSelector(
    selector,
    failSelector,
    wait = true,
    initialWait = true,
    i = 0
  ) {
    // Timeout après ~6 secondes
    if (i === 20) {
      console.log(
        `Le sélecteur "${selector}" n'a pas été trouvé après 5 secondes. Ce n'est pas forcément un bug.`
      );
      return null;
    }
    i++;

    if (initialWait) {
      await waitTimeout(500 + Math.floor(Math.random() * 500));
    }

    // On essaie d'échouer rapidement si on nous a donner un failSelector
    if (failSelector) {
      const $elFail = document.querySelector(failSelector);
      if ($elFail !== null) {
        return null;
      }
    }

    const $el = document.querySelector(selector);
    if (!wait) return $el;

    if ($el === null) {
      await waitTimeout(300);
      // C'est reparti pour un tour.
      return waitForSelector(selector, failSelector, wait, false, i);
    }

    return $el;
  }

  // La logique de cette fonction a été partiellement piquée à la librairie
  // dom-testing-library.
  async function waitForElementToBeRemoved(element) {
    let i = 0;

    if (!element) {
      throw new Error(
        "L'élement demandé pour waitForElementToBeRemoved était déjà absent avant de commencer ! L'élément doit exister."
      );
    }

    let parent = element.parentElement;
    if (parent === null) return; // déjà disparu
    // Recherchons le parent le plus haut
    while (parent.parentElement) parent = parent.parentElement;

    while (parent.contains(element)) {
      if (++i > 20) {
        throw new Error(
          "L'élement demandé n'a pas disparu au bout de 5 secondes"
        );
      }
      await waitTimeout(300);
    }
  }

  function selectOption($select, $option) {
    const evt = document.createEvent("HTMLEvents");
    evt.initEvent("change", true, true);

    $select.value = $option.value;
    $select.dispatchEvent(evt);
  }

  // Parfois on doit envoyer un vrai click avec tous les événements.
  function fireFullClick(target) {
    ["mousedown", "mouseup", "click"].forEach((type) => {
      const evt = new MouseEvent(type, { bubbles: true, cancelable: true });
      target.dispatchEvent(evt);
    });
  }

  function isARNmMotive(text) {
    return (
      (text.includes("Pfizer") || text.includes("Moderna")) && // On ne veut que du Pifzer ou du Moderna, seuls ouverts à la population générale
      !(
        (text.startsWith("2") || text.startsWith("3")) // La deuxième et la troisième dose doivent être exclue (ex : https://www.doctolib.fr/vaccination-covid-19/lille/centre-de-vaccination-covid-19-centre-de-vaccination-covid-19-zenith-de-lille?highlight%5Bspeciality_ids%5D%5B%5D=5494)
      ) &&
      !text.includes("unique") && // On ne veut pas sélectionner l'injection unique mais la double injection (ex: https://www.doctolib.fr/vaccination-covid-19/lyon/vaccinationhcl?highlight%5Bspeciality_ids%5D%5B%5D=5494&pid=practice-163796)
      !text.includes("sans rappel") // idem (ex: https://www.doctolib.fr/pharmacie/savigneux/pharmacie-de-savigneux, https://www.doctolib.fr/vaccination-covid-19/montbrison/centre-de-vaccination-covid-ville-de-montbrison?highlight%5Bspeciality_ids%5D%5B%5D=5494)
    );
  }

  function isGeneralPopulationMotive(text) {
    // Doit matcher :
    // * "Patients de 18 à 50 ans"
    // * "Je suis un particulier"
    // * "Patients éligibles" (Centre Air France)
    // * "Patients de moins 50 ans"
    // * "Patients de moins de 50 ans"
    // * "Grand public"
    // * "Patient de plus de 18 ans" (Centre de Nogent-sur-Marne)
    // * "Personnes de plus de 12 ans" (CHU de Caen)
    // * "Personnes de 18 ans et plus" (GH Saint-Vincent de Strasbourg)
    //
    // Ne doit pas matcher :
    // * "plus de 18 ans avec comorbidité"
    // * "Patients de plus de 50 ans"
    // * "Patient de 16 à 18 ans de très haute priorité"
    //
    // Oui, ça mériterait un test unitaire !
    return (
      /(?:18 à|plus de (?:12|18)|18 ans et plus|particulier|éligibles|moins (?:de )?50|public)/i.test(
        text
      ) &&
      !text.includes("comorb") &&
      !text.includes("haute priorité")
    );
  }

  function getAvailableSlot() {
    return waitForSelector(
      ".availabilities-slot:not([disabled])",
      ".booking-availabilities .booking-message.booking-message-warning"
    );
  }

  let running = false;
  async function checkAvailability() {
    const { locations, stopped, autoBook } = await browser.storage.sync.get({
      locations: {},
      stopped: false,
      autoBook: false,
    });

    if (stopped || !locations[url]) {
      running = false;
      return;
    }

    running = true;
    let found = false,
      slot = null;

    console.info(`Vérification de ${url}`);

    try {
      let wait = false;

      // Possible étape 1 : "Avez-vous déjà consulté un praticien de cet établissement ?" (non)
      const $questionPreviousPatient = await waitForSelector(
        ".dl-new-patient-option",
        undefined,
        true,
        false
      );
      if ($questionPreviousPatient) {
        let optionFound = false;
        for (const $button of document.querySelectorAll(
          ".dl-new-patient-option"
        )) {
          if ($button.textContent.includes("Non")) {
            fireFullClick($button);
            optionFound = true;
            wait = true;
            break;
          }
        }
        if (!optionFound)
          throw new Error(
            "N'a pas pu répondre 'Non' à la question de nouveau patient"
          );
      }

      // Possible étape 2 : spécialité (ex : https://www.doctolib.fr/centre-de-sante/paris/sos-medecins-paris?pid=practice-165129)
      const $bookingSpecialty = await waitForSelector(
        "#booking_speciality",
        undefined,
        wait,
        wait
      );
      wait = false;
      if ($bookingSpecialty) {
        const options = [];
        let optionFound = false;
        for (const $option of $bookingSpecialty.querySelectorAll("option")) {
          options.push($option.textContent);
          // Voir
          // https://www.doctolib.fr/pharmacie/savigneux/pharmacie-de-savigneux
          // pour "Pharmacien".
          if (!/vaccination|pharmacien/i.test($option.textContent)) continue;
          selectOption($bookingSpecialty, $option);
          optionFound = true;
          wait = true;
          break;
        }

        if (!optionFound)
          throw new Error(
            `Spécialité non trouvée. Spécialités disponibles : ${options.join(
              ", "
            )}`
          );
      }

      // Possible étape 3 : catégorie de motif
      const $bookingCategoryMotive = await waitForSelector(
        "#booking_motive_category",
        undefined,
        wait,
        wait
      );
      wait = false;
      if ($bookingCategoryMotive) {
        const options = [];
        let optionFound = false;
        for (const $option of $bookingCategoryMotive.querySelectorAll(
          "option"
        )) {
          options.push($option.textContent);
          if (
            !isARNmMotive($option.textContent) &&
            !isGeneralPopulationMotive($option.textContent)
          )
            continue;
          selectOption($bookingCategoryMotive, $option);
          optionFound = true;
          wait = true;
          break;
        }

        if (!optionFound)
          throw new Error(
            `Catégorie de motif non trouvé. Motifs disponibles : ${options.join(
              ", "
            )}`
          );
      }

      // Possible étape 4 : motif de consultation
      const $bookingMotive = await waitForSelector(
        "#booking_motive",
        undefined,
        wait,
        wait
      );
      if ($bookingMotive) {
        let optionFound = false;
        for (const $option of $bookingMotive.querySelectorAll("option")) {
          // On ne s'occupe que de Pfizer et Moderna
          // Pour le reste pas besoin de l'extension, de nombreux RDV sont disponibles
          if (!isARNmMotive($option.textContent)) continue;

          selectOption($bookingMotive, $option);
          optionFound = true;

          // Il peut y avoir des places pour Moderna mais pas pour Pfizer, ou inversement, il faut tester les deux
          slot = await getAvailableSlot();
          if (slot !== null) break;
        }

        if (!optionFound) throw new Error("Injection ARNm non disponible 1");
      } else {
        // On a peut-être directement la boite "pas de créneaux possibles"
        // Cas où il n'y a qu'un choix
        const $bookingContent = document.getElementById("booking-content");
        if (
          $bookingContent === null ||
          !isARNmMotive($bookingContent.textContent)
        )
          throw new Error("Injection ARNm non disponible 2");
        slot = await getAvailableSlot();
      }

      if (slot === null) {
        const $nextAvailabilities = await waitForSelector(
          ".availabilities-next-slot button"
        );
        if (!$nextAvailabilities) throw new Error("Aucun créneau disponible 2");
        $nextAvailabilities.click();

        slot = await getAvailableSlot();
        if (slot === null) throw new Error("Aucun créneau disponible 3");
      }

      // formats :
      // lun. 17 mai 08:54
      // ven. 13 août 09:10
      // jeu. 29 juil. 13:25
      const parts = slot.title.match(
        /([0-9]+) [\p{Letter}]+\.? ([0-9]+:[0-9]+)/gu
      );
      if (!parts) {
        throw new Error(
          `Impossible de cliquer sur le slot avec le titre ${slot.title}`
        );
      }
      const date = new Date(
        `${MONTHS[parts[2]]} ${parts[1]} ${new Date().getFullYear()} ${
          parts[3]
        }`
      );

      const tomorrow = new Date();
      tomorrow.setHours(23);
      tomorrow.setMinutes(59);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date > tomorrow && date < new Date("2021-05-31T00:20:00"))
        throw new Error(
          "Pas de créneau dispo d'ici demain soir ou après le 31 mai"
        );

      if (!autoBook) {
        browser.runtime.sendMessage({
          type: "found",
          url,
          location: locations[url],
        });

        return;
      }
      found = true;

      // Sélection du 1er RDV
      slot.click();

      // Sélection du 2ème RDV
      const overlay = document.querySelector(
        ".dl-desktop-availabilities-overlay"
      );
      if (overlay) {
        await waitForElementToBeRemoved(overlay);
      }

      let slot2 = await getAvailableSlot();
      if (slot2 === null) {
        // Dans de rares cas, il faut cliquer sur "Prochain RDV" aussi pour le
        // second rendez-vous
        const $nextAvailabilities = await waitForSelector(
          ".availabilities-next-slot button"
        );
        if (!$nextAvailabilities)
          throw new Error(
            "Aucun créneau disponible pour le second rendez-vous 1"
          );
        $nextAvailabilities.click();

        slot2 = await getAvailableSlot();
        if (slot2 === null)
          throw new Error(
            "Aucun créneau disponible pour le second rendez-vous 2"
          );
      }

      slot2.click();

      // Boutons "J'accepte" dans la popup "À lire avant de prendre un rendez-vous"
      let el;
      while (
        (el = await waitForSelector(
          ".dl-button-check-inner:not([disabled])"
        )) ||
        // Bouton radio "J'ai 18 ans ou plus", dernièr élément qui nécessite un traitement spécial avant l'apparition du bouton de confirmation
        (el = await waitForSelector(
          ".dl-appointment-rule-radio-group .dl-radio-button-label:nth-child(2) input:not(:checked)"
        ))
      ) {
        el.click();
      }

      // Bouton de confirmation de la popup
      const popupConfirmation = await waitForSelector(
        ".dl-modal-footer .dl-button-label"
      );
      if (!popupConfirmation) {
        throw new Error(
          "Impossible de trouver le bouton pour confirmer le dialogue 'à lire'."
        );
      }

      fireFullClick(popupConfirmation);

      // Pour qui prenez-vous ce rendez-vous ? (moi)
      const masterPatientId = await waitForSelector(
        'input[name="masterPatientId"]'
      );
      if (masterPatientId) {
        masterPatientId.click();
      }

      // Avez-vous déjà consulté ce praticien ? (non)
      const $no = await waitForSelector("#late_new_patient_question-1");
      if ($no) fireFullClick($no);

      // Confirmation finale
      document.querySelector('button[type="submit"]').click();

      await waitTimeout(3000);

      await browser.runtime.sendMessage({
        type: "booked",
        url,
        location: locations[url],
      });
    } catch (e) {
      console.debug(e);

      if (found) {
        // Réservation non terminée
        await browser.runtime.sendMessage({
          type: "found",
          url,
          location: locations[url],
        });

        return;
      }

      await browser.runtime.sendMessage({
        type: "error",
        url,
        message: e.message,
        location: locations[url],
        error: {
          // https://stackoverflow.com/a/53624454/1352334
          ...e,
          name: e.name,
          message: e.message,
          stack: e.stack,
        },
      });
    }
  }

  browser.storage.onChanged.addListener((change, areaName) => {
    if (
      areaName === "sync" &&
      change.stopped &&
      !change.stopped.newValue &&
      !running
    )
      checkAvailability();
  });

  window.addEventListener(
    "message",
    (event) => {
      const data = event.data;

      if (data.type === "retry") {
        // On essaie de ne pas recharger toute la page
        const $bookingMotive = document.querySelector("#booking_motive");
        if ($bookingMotive) {
          selectOption($bookingMotive, { value: "" });
          checkAvailability();
        }
        // Sinon on recharge tout
        else window.location.reload();
      }
    },
    false
  );

  checkAvailability();
})();
