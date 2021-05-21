(async function () {
  if (window.vaccinClickBookHasRun) return;
  window.vaccinClickBookHasRun = true;

  // Sauvegarde de l'URL originale, avant que l'on change de page
  const url = document.URL;

  // Préparation à la levée de la contrainte des 24h, et debug
  const DOSE_24H = false;

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

  async function findElementWithWait(selector, wait = true) {
    console.log(selector);
    // On cherche d'abord si l'élèment est déjà présent
    const $elem = document.querySelector(selector);
    if (!wait || $elem !== null) return $elem;

    console.log("waiting for " + selector);

    // Sinon on test à chaque mutation du DOM
    let observer;
    const domObserver = new Promise((resolve) => {
      observer = new MutationObserver(() => {
        const $elem = document.querySelector(selector);
        if ($elem === null) return;

        observer.disconnect();
        resolve($elem);
      });
    });

    observer.observe(document.getElementsByTagName("body")[0], {
      attributes: true,
      childList: true,
      subtree: true,
    });

    // On règle un timeout pour ne pas attendre eternellement
    const timer = new Promise((resolve) => {
      setTimeout(() => {
        observer.disconnect();

        resolve(null);
      }, 5000);
    });

    return Promise.race([domObserver, timer]);
  }

  async function selectOption($select, $option) {
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
      )
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
    //
    // Ne doit pas matcher :
    // * "plus de 18 ans avec comorbidité"
    // * "Patients de plus de 50 ans"
    //
    // Oui, ça mériterait un test unitaire !
    return (
      /(?:18 à|particulier|éligibles|moins (?:de )?50|public)/i.test(text) &&
      !text.includes("comorb")
    );
  }

  async function getAvailableSlot() {
    return findElementWithWait(".availabilities-slot");
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
      const $questionPreviousPatient = await findElementWithWait(".dl-new-patient-option");
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
      const $bookingSpecialty = await findElementWithWait(
        "#booking_speciality",
        wait
      );
      wait = false;
      if ($bookingSpecialty) {
        const options = [];
        let optionFound = false;
        for (const $option of $bookingSpecialty.querySelectorAll("option")) {
          options.push($option.textContent);
          if (!/vaccination/i.test($option.textContent)) continue;
          selectOption($bookingSpecialty, $option);
          optionFound = true;
          wait = true;
          break;
        }

        if (!optionFound) {
          throw new Error(
            `Spécialité non trouvée. Spécialités disponibles : ${options.join(
              ", "
            )}`
          );
        }
      }

      // Possible étape 3 : catégorie de motif
      const $bookingCategoryMotive = await findElementWithWait(
        "#booking_motive_category",
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
      const $bookingMotive = await findElementWithWait("#booking_motive", wait);
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
        if (DOSE_24H) throw new Error("Aucun créneau disponible 1");

        const $nextAvailabilities = await findElementWithWait(
          ".availabilities-next-slot button"
        );
        if (!$nextAvailabilities) throw new Error("Aucun créneau disponible 2");
        $nextAvailabilities.click();

        slot = await getAvailableSlot();
        console.log(slot, document.querySelector(".availabilities-slot"));

        if (slot === null) throw new Error("Aucun créneau disponible 3");
      }

      if (DOSE_24H) {
        // format : lun. 17 mai 08:54
        const parts = slot.title.match(/([0-9]+) ([a-z]+) ([0-9]+:[0-9]+)/);
        const date = new Date(
          `${MONTHS[parts[2]]} ${parts[1]} ${new Date().getFullYear()} ${
            parts[3]
          }`
        );

        const tomorrow = new Date();
        tomorrow.setHours(23);
        tomorrow.setMinutes(59);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date > tomorrow)
          throw new Error("Pas de créneau dispo d'ici demain soir");
      }

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
      const slot2 = await getAvailableSlot();
      if (slot2) slot2.click();

      // Boutons "J'accepte" dans la popup "À lire avant de prendre un rendez-vous"
      let el;
      while (
        (el = await findElementWithWait(
          ".dl-button-check-inner:not([disabled])"
        ))
      ) {
        el.click();
      }

      // Bouton de confirmation de la popup
      fireFullClick(
        await findElementWithWait(".dl-modal-footer .dl-button-label")
      );

      // Pour qui prenez-vous ce rendez-vous ? (moi)
      const masterPatientId = await findElementWithWait(
        'input[name="masterPatientId"]'
      );
      if (masterPatientId) {
        masterPatientId.click();
      }

      // Avez-vous déjà consulté ce praticien ? (non)
      const $no = await findElementWithWait("#late_new_patient_question-1");
      if ($no) $no.checked = true;

      // Confirmation finale
      document.querySelector('button[type="submit"]').click();

      await new Promise((r) => setTimeout(r, 3000));

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
        location: locations[url],
        error: {
          // https://stackoverflow.com/a/53624454/1352334
          ...e,
          name: e.name,
          message: e.message,
          stack: e.stack,
        }
      });
    } finally {
      browser.runtime.sendMessage({
        type: "over",
        url,
        location: locations[url]
      });
    }
  }

  browser.storage.onChanged.addListener(async (change, areaName) => {
    if (
      areaName === "sync" &&
      change.stopped &&
      !change.stopped.newValue &&
      !running
    )
      checkAvailability();
  });

  checkAvailability();
})();
