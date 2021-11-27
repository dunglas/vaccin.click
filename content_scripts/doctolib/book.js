(async function () {
  if (window.vaccinClickBookHasRun) return;
  window.vaccinClickBookHasRun = true;

  // Sauvegarde de l'URL originale, avant que l'on change de page
  const url = document.URL;

  // Convertit le nom du mois dans le nombre
  function monthToNumber(month) {
    if (/jan/i.test(month)) return 1;
    if (/fev|feb/i.test(month)) return 2;
    if (/mar|mär/i.test(month)) return 3;
    if (/avr|apr/i.test(month)) return 4;
    if (/mai/i.test(month)) return 5;
    if (/jun/i.test(month)) return 6;
    if (/jul/i.test(month)) return 7;
    if (/aou|aug/i.test(month)) return 8;
    if (/sep/i.test(month)) return 9;
    if (/oct|okt/i.test(month)) return 10;
    if (/nov/i.test(month)) return 11;
    if (/dec|dez/i.test(month)) return 12;
    return null;
  }

  // Si le mois selectionné est plus grand que le mois actuel, on ajoute un an
  function estimateYear(currentMonth, selectedMonth) {
    if (currentMonth > selectedMonth) return new Date().getFullYear() + 1;
    return new Date().getFullYear();
  }

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

  /**
   * @param {Element} $select
   * @param {($option: Element) => boolean} matchOption
   */
  function selectOptionInSelect($select, matchOption) {
    let optionFound = false;
    const options = [];

    for (const $option of $select.querySelectorAll("option")) {
      options.push($option.textContent);
      if (!matchOption($option)) continue;
      selectOption($select, $option);
      optionFound = true;
      break;
    }

    return { options, optionFound };
  }

  /**
   * @param {Element} $option
   */
  function testIsVaccinationMotive($option) {
    // Voir
    // https://www.doctolib.fr/pharmacie/savigneux/pharmacie-de-savigneux
    // pour "Pharmacien".
    return /vaccination|pharmacien|impfung/i.test($option.textContent);
  }

  /**
   * @param {'fullServiceInjection' | 'firstInjectionOnly' | 'secondInjectionOnly' | 'thirdInjectionOnly'} injectionType
   * @param {'modernaInjection' | 'pfizerInjection'} injectionVaccine
   */
  function testIsARNmMotive(injectionType, injectionVaccine) {
    /**
     * @param {Element} $option
     */
    return function ($option) {
      return isARNmMotive($option.textContent, injectionType, injectionVaccine);
    };
  }

  // Parfois on doit envoyer un vrai click avec tous les événements.
  function fireFullClick(target) {
    ["mousedown", "mouseup", "click"].forEach((type) => {
      const evt = new MouseEvent(type, { bubbles: true, cancelable: true });
      target.dispatchEvent(evt);
    });
  }

  /**
   * @param {string} text La description de la dose venant de Doctolib
   * @param {'fullServiceInjection' | 'firstInjectionOnly' | 'secondInjectionOnly' | 'thirdInjectionOnly'} injectionType Le type d'injection choisi par le user
   * @param {'modernaInjection' | 'pfizerInjection'} injectionVaccine Le vaccin d'injection choisi par le user
   */
  function isARNmMotive(text, injectionType, injectionVaccine) {
    return (
      text.includes(
        injectionVaccine === "modernaInjection" ? "Moderna" : "Pfizer"
      ) &&
      (injectionType === "fullServiceInjection"
        ? isfullServiceInjection(text)
        : injectionType === "firstInjectionOnly"
        ? firstInjectionOnly(text)
        : injectionType === "secondInjectionOnly"
        ? secondInjectionOnly(text)
        : injectionType === "thirdInjectionOnly"
        ? thirdInjectionOnly(text)
        : false)
    );
  }

  function isfullServiceInjection(text) {
    return (
      // doctolib.de search conditions
      (text.includes("Erstimpfung") && text.includes("Zweittermin")) ||
      // docotolib.fr search conditions
      (text.startsWith("1") && text.includes("avec rappel"))
    );
  }

  function firstInjectionOnly(text) {
    return (
      // doctolib.de search conditions
      (text.includes("Erstimpfung") && !text.includes("Zweittermin")) ||
      // doctolib.fr search conditions
      (text.startsWith("1") && text.includes("sans rappel"))
    );
  }

  function secondInjectionOnly(text) {
    return (
      // doctolib.de search conditions
      text.startsWith("Zweitimpfung") ||
      // doctolib.fr search conditions
      text.startsWith("2")
    );
  }

  function thirdInjectionOnly(text) {
    return (
      // doctolib.de search conditions
      text.startsWith("Auffrischungsimpfung") ||
      // doctolib.fr search conditions
      text.startsWith("3") ||
      text.includes("dose de rappel")
    );
  }

  function getAvailableSlot() {
    return waitForSelector(
      ".availabilities-slot:not([disabled])",
      ".booking-availabilities .booking-message.booking-message-warning"
    );
  }

  async function answerNoForPreviousPatient() {
    let success = false;

    const $questionPreviousPatient = await waitForSelector(
      ".dl-new-patient-option",
      undefined,
      false,
      true
    );

    if ($questionPreviousPatient) {
      $button = document.querySelector("#all_visit_motives-1"); // On choisit "Non"

      if ($button != null) {
        fireFullClick($button);
        success = true;
      } else {
        console.debug(
          "N'a pas pu répondre 'Non' à la question de nouveau patient"
        );
      }
    }

    return success;
  }

  async function chooseSpeciality() {
    let success = false;

    const $bookingSpecialty = await waitForSelector(
      "#booking_speciality",
      undefined,
      false,
      true
    );
    if ($bookingSpecialty) {
      const { options, optionFound } = selectOptionInSelect(
        $bookingSpecialty,
        testIsVaccinationMotive
      );

      if (optionFound) {
        success = true;
      } else {
        throw new Error(
          `Spécialité non trouvée. Spécialités disponibles : ${options.join(
            ", "
          )}`
        );
      }
    }

    return success;
  }

  async function choosePhysicalAppointement() {
    let success = false;

    const $teleHealth = await waitForSelector(
      `input[name="telehealth"]`,
      undefined,
      false,
      false
    );
    if ($teleHealth) {
      fireFullClick($teleHealth);
      success = true;
    }

    return success;
  }

  let running = false;
  async function checkAvailability() {
    const { locations, stopped, autoBook, injectionType, injectionVaccine } =
      await browser.storage.sync.get({
        locations: {},
        stopped: false,
        autoBook: false,
        injectionType: "fullServiceInjection",
        injectionVaccine: "modernaInjection",
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

      // Suite d'étapes possibles :
      // 1. On répond à la question si on est un nouveau patient
      // 2. (Optionel) On choisit un RDV sur place et non vidéo (très courant sur doctolib.de) -> https://www.doctolib.de/orthopadie/berlin/detlef-kaleth
      // 3. On choisit la spécialité (vaccination covid-19)
      // Ou alors:
      // 1. On choisit la specialité (vaccination covid-19)
      // 2. On répond à la question si on est un nouveau patient
      if (await answerNoForPreviousPatient()) {
        await choosePhysicalAppointement();
        await chooseSpeciality();
      } else {
        await chooseSpeciality();
        await answerNoForPreviousPatient();
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
        const vaccinationMotive = selectOptionInSelect(
          $bookingCategoryMotive,
          testIsVaccinationMotive
        );

        const arnMotive = selectOptionInSelect(
          $bookingCategoryMotive,
          testIsARNmMotive(injectionType, injectionVaccine)
        );

        if (!vaccinationMotive.optionFound && !arnMotive.optionFound) {
          throw new Error(
            `Catégorie de motif non trouvé. Motifs disponibles : ${vaccinationMotive.options.join(
              ", "
            )}`
          );
        } else {
          wait = true;
        }
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
          if (
            !isARNmMotive($option.textContent, injectionType, injectionVaccine)
          )
            continue;

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
          !isARNmMotive(
            $bookingContent.textContent,
            injectionType,
            injectionVaccine
          )
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

      // formats france:
      // lun. 17 mai 08:54
      // ven. 13 août 09:10
      // jeu. 29 juil. 13:25

      // formats allemagne:
      // Do., 3. Feb., 08:25
      slot.title = slot.title.replace(/,/giu, "");

      const parts = slot.title.match(
        /([0-9]+)\.? ([\p{Letter}]+)\.? ([0-9]+:[0-9]+)/u
      );
      if (!parts) {
        throw new Error(
          `Impossible de cliquer sur le slot avec le titre ${slot.title}`
        );
      }

      const currentMonth = new Date().getMonth();
      const selectedMonth = monthToNumber(parts[2]);
      const selectedDay = parseInt(parts[1]);
      const selectedYear = estimateYear(currentMonth, selectedMonth);
      const selectedTime = parts[3];

      const date = new Date(
        `${selectedMonth} ${selectedDay} ${selectedYear} ${selectedTime}`
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
      if (injectionType === "fullServiceInjection") {
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
      }

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

      // Ici la page entière recharge et le script ne peut pas continuer avec le choix du patient
      // TODO: fix issue #70 see PR #81 for more information
      throw new Error("Confirmation manuelle du RDV nécessaire");

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
