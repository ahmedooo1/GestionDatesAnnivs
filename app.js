// Structures des données - définies directement en JS
let data = {
    groups: [],
    birthdays: []
};

// Paramètres de notification par défaut
let notificationSettings = {
    notifyWeek: true, // 7 jours avant
    notifyThreeDays: true, // 3 jours avant
    notifyDayBefore: true, // 1 jour avant
    notifySameDay: true, // Le jour même
    notificationTime: "09:00", // Heure de notification
};

// Éléments DOM
document.addEventListener("DOMContentLoaded", () => {
    // Récupérer les éléments du DOM
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");
    const upcomingBirthdaysContainer =
        document.getElementById("upcoming-birthdays");
    const groupsListContainer = document.getElementById("groups-list");
    const newGroupNameInput = document.getElementById("new-group-name");
    const addGroupBtn = document.getElementById("add-group-btn");
    const birthdayForm = document.getElementById("birthday-form");
    const groupSelect = document.getElementById("group");
    const notification = document.getElementById("notification");
    const enableNotificationsBtn = document.getElementById(
        "enable-notifications",
    );
    const notificationPermissionDiv = document.getElementById(
        "notification-permission",
    );
    const exportBtn = document.getElementById("export-btn");
    const importBtn = document.getElementById("import-btn");
    const importFile = document.getElementById("import-file");
    const saveSettingsBtn = document.getElementById("save-settings");

    // Éléments de la chronologie
    const timelineContainer = document.getElementById("timeline-container");
    const timelineGroupFilter = document.getElementById(
        "timeline-group-filter",
    );
    const monthViewBtn = document.getElementById("month-view-btn");
    const seasonViewBtn = document.getElementById("season-view-btn");

    // Chargement initial des données
    loadData();

    // Configurer les écouteurs d'événements
    // Gestion des onglets
    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const tabId = button.getAttribute("data-tab");
            switchTab(tabId, tabButtons, tabPanes);

            // Si on passe à l'onglet chronologie, générer la vue
            if (tabId === "timeline") {
                renderTimelineTab();
            }
        });
    });

    // Ajouter un groupe
    addGroupBtn.addEventListener("click", () => {
        addGroup(newGroupNameInput, groupsListContainer, groupSelect);
    });

    // Ajouter un anniversaire
    birthdayForm.addEventListener("submit", (e) => {
        e.preventDefault();
        addBirthday(
            birthdayForm,
            upcomingBirthdaysContainer,
            tabButtons,
            tabPanes,
        );
    });

    // Exporter les données
    exportBtn.addEventListener("click", exportData);

    // Importer les données
    importBtn.addEventListener("click", () => {
        if (importFile.files.length > 0) {
            importData(importFile.files[0]);
        } else {
            showNotification("Veuillez sélectionner un fichier à importer.");
        }
    });

    // Enregistrer les paramètres de notification
    saveSettingsBtn.addEventListener("click", () => {
        // Récupérer les valeurs des paramètres
        notificationSettings.notifyWeek =
            document.getElementById("notify-week").checked;
        notificationSettings.notifyThreeDays =
            document.getElementById("notify-three-days").checked;
        notificationSettings.notifyDayBefore =
            document.getElementById("notify-day-before").checked;
        notificationSettings.notifySameDay =
            document.getElementById("notify-same-day").checked;
        notificationSettings.notificationTime =
            document.getElementById("notification-time").value;

        // Sauvegarder les paramètres
        localStorage.setItem(
            "notificationSettings",
            JSON.stringify(notificationSettings),
        );

        // Afficher une notification
        showNotification("Paramètres de notification enregistrés");

        // Forcer une vérification des notifications
        checkNotifications();
    });

    // Gestion des notifications
    if (Notification.permission === "granted") {
        notificationPermissionDiv.style.display = "none";
    }

    enableNotificationsBtn.addEventListener("click", () => {
        requestNotificationPermission();

        if (Notification.permission === "granted") {
            notificationPermissionDiv.style.display = "none";
        }
    });

    // Vérifier les notifications toutes les heures
    checkNotifications();
    setInterval(checkNotifications, 3600000); // 3600000 ms = 1 heure

    // Événements pour la chronologie
    monthViewBtn.addEventListener("click", () => {
        monthViewBtn.classList.add("active");
        seasonViewBtn.classList.remove("active");
        renderTimelineView("month");
    });

    seasonViewBtn.addEventListener("click", () => {
        seasonViewBtn.classList.add("active");
        monthViewBtn.classList.remove("active");
        renderTimelineView("season");
    });

    timelineGroupFilter.addEventListener("change", () => {
        // Récupérer le mode de vue actuel
        const viewMode = monthViewBtn.classList.contains("active")
            ? "month"
            : "season";
        renderTimelineView(viewMode);
    });
});

// Chargement des données depuis le localStorage
function loadData() {
    try {
        // Données définies directement en JS, pas besoin de récupérer depuis un fichier
        const savedData = localStorage.getItem("birthdayData");
        if (savedData) {
            data = JSON.parse(savedData);
            console.log("Données chargées depuis le localStorage");
        } else {
            // Utiliser les données définies en haut du fichier
            // Sauvegarder dans le localStorage pour les récupérer plus tard
            localStorage.setItem("birthdayData", JSON.stringify(data));
        }

        // Charger les paramètres de notification
        const savedSettings = localStorage.getItem("notificationSettings");
        if (savedSettings) {
            notificationSettings = JSON.parse(savedSettings);
            console.log("Paramètres de notification chargés");
        } else {
            // Sauvegarder les paramètres par défaut
            localStorage.setItem(
                "notificationSettings",
                JSON.stringify(notificationSettings),
            );
        }

        // Mettre à jour l'interface
        renderUpcomingBirthdays(document.getElementById("upcoming-birthdays"));
        renderGroups(document.getElementById("groups-list"));
        updateGroupOptions(document.getElementById("group"));
        updateTimelineGroupFilter();
        updateSettingsUI();

        showNotification("Données chargées avec succès");
    } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        showNotification("Erreur lors du chargement des données");
    }
}

// Mettre à jour l'interface des paramètres
function updateSettingsUI() {
    // Mettre à jour les checkboxes avec les valeurs actuelles
    document.getElementById("notify-week").checked =
        notificationSettings.notifyWeek;
    document.getElementById("notify-three-days").checked =
        notificationSettings.notifyThreeDays;
    document.getElementById("notify-day-before").checked =
        notificationSettings.notifyDayBefore;
    document.getElementById("notify-same-day").checked =
        notificationSettings.notifySameDay;
    document.getElementById("notification-time").value =
        notificationSettings.notificationTime;
}

// Changement d'onglet
function switchTab(tabId, tabButtons, tabPanes) {
    tabButtons.forEach((button) => {
        button.classList.remove("active");
        if (button.getAttribute("data-tab") === tabId) {
            button.classList.add("active");
        }
    });

    tabPanes.forEach((pane) => {
        pane.classList.remove("active");
        if (pane.id === tabId) {
            pane.classList.add("active");
        }
    });
}

// Afficher les anniversaires à venir
function renderUpcomingBirthdays(container) {
    if (!container) return;

    if (data.birthdays.length === 0) {
        container.innerHTML =
            '<p class="empty-message">Aucun anniversaire à venir.</p>';
        return;
    }

    // Trier les anniversaires par date à venir
    const sortedBirthdays = getSortedUpcomingBirthdays();

    let html = "";
    sortedBirthdays.forEach((birthday, index) => {
        if (index < 10) {
            // Limiter à 10 anniversaires
            const daysUntil = birthday.daysUntil;
            let classes = "";

            if (daysUntil === 0) {
                classes = "today";
            } else if (daysUntil <= 7) {
                classes = "very-soon";
            } else if (daysUntil <= 30) {
                classes = "soon";
            }

            const group = data.groups.find((g) => g.id === birthday.groupId);
            const groupName = group ? group.name : "Sans groupe";

            html += `
                <div class="birthday-item ${classes}">
                    <div class="info">
                        <h3>${birthday.name}</h3>
// Afficher les anniversaires à venir
function renderUpcomingBirthdays(container) {
    if (!container) return;

    if (data.birthdays.length === 0) {
        container.innerHTML =
            '<p class="empty-message">Aucun anniversaire à venir.</p>';
        return;
    }

    // Trier les anniversaires par date à venir
    const sortedBirthdays = getSortedUpcomingBirthdays();

    let html = "";
    sortedBirthdays.forEach((birthday, index) => {
        if (index < 10) {
            // Limiter à 10 anniversaires
            const daysUntil = birthday.daysUntil;
            let classes = "";

            if (daysUntil === 0) {
                classes = "today";
            } else if (daysUntil <= 7) {
                classes = "very-soon";
            } else if (daysUntil <= 30) {
                classes = "soon";
            }

            const group = data.groups.find((g) => g.id === birthday.groupId);
            const groupName = group ? group.name : "Sans groupe";

            html += `
                <div class="birthday-item ${classes}">
                    <div class="info">
                        <h3>${birthday.name}</h3>
                        <p>Date: ${new Date(birthday.date).getDate()}/${new Date(birthday.date).getMonth() + 1}</p>
                        <p>Groupe: ${groupName}</p>
                        <p>${getDaysMessage(daysUntil)}</p>
                    </div>
                    <div class="actions">
                        <button onclick="editBirthday('${birthday.id}')">Modifier</button>
                        <button onclick="deleteBirthday('${birthday.id}')">Supprimer</button>
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}
                        <p>Groupe: ${groupName}</p>
                        <p>${getDaysMessage(daysUntil)}</p>
                    </div>
                    <div class="actions">
                        <button onclick="editBirthday('${birthday.id}')">Modifier</button>
                        <button onclick="deleteBirthday('${birthday.id}')">Supprimer</button>
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}

// Trier les anniversaires à venir
function getSortedUpcomingBirthdays() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const sortedBirthdays = [];

    data.birthdays.forEach((birthday) => {
        const birthDate = new Date(birthday.date);
        const birthMonth = birthDate.getMonth();
        const birthDay = birthDate.getDate();

        // Date d'anniversaire cette année
        let nextBirthday = new Date(currentYear, birthMonth, birthDay);

        // Si l'anniversaire est déjà passé cette année, prendre l'année prochaine
        if (nextBirthday < today) {
            nextBirthday = new Date(currentYear + 1, birthMonth, birthDay);
        }

        // Calculer les jours restants
        const timeDiff = nextBirthday.getTime() - today.getTime();
        const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));

        sortedBirthdays.push({
            ...birthday,
            nextBirthday,
            daysUntil,
        });
    });

    // Trier par date la plus proche
    return sortedBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
}

// Message pour les jours restants
function getDaysMessage(days) {
    if (days === 0) {
        return "C'est aujourd'hui !";
    } else if (days === 1) {
        return "C'est demain !";
    } else {
        return `Dans ${days} jours`;
    }
}

// Formater la date
function formatDate(dateString) {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
}

// Afficher les groupes
function renderGroups(container) {
    if (!container) return;

    if (data.groups.length === 0) {
        container.innerHTML = '<p class="empty-message">Aucun groupe créé.</p>';
        return;
    }

    let html = "";
    data.groups.forEach((group) => {
        const memberCount = data.birthdays.filter(
            (b) => b.groupId === group.id,
        ).length;

        html += `
            <div class="group-item">
                <div class="info">
                    <h3>${group.name}</h3>
                    <p>${memberCount} membre${memberCount !== 1 ? "s" : ""}</p>
                </div>
                <div class="actions">
                    <button onclick="showGroupMembers('${group.id}')">Voir les membres</button>
                    <button onclick="editGroup('${group.id}')">Renommer</button>
                    <button onclick="deleteGroup('${group.id}')">Supprimer</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Mettre à jour les options de groupe dans le formulaire
function updateGroupOptions(selectElement) {
    if (!selectElement) return;

    let options = '<option value="">Sélectionnez un groupe</option>';
    data.groups.forEach((group) => {
        options += `<option value="${group.id}">${group.name}</option>`;
    });
    selectElement.innerHTML = options;
}

// Ajouter un groupe
function addGroup(inputElement, groupsContainer, selectElement) {
    const name = inputElement.value.trim();

    if (name === "") {
        showNotification("Veuillez entrer un nom de groupe.");
        return;
    }

    const newGroup = {
        id: generateId(),
        name: name,
    };

    data.groups.push(newGroup);
    saveData();

    inputElement.value = "";
    renderGroups(groupsContainer);
    updateGroupOptions(selectElement);
    updateTimelineGroupFilter(); // Mettre à jour aussi le filtre de la chronologie
    showNotification(`Groupe "${name}" créé avec succès.`);
}

// Ajouter un anniversaire
function addBirthday(formElement, birthdaysContainer, tabButtons, tabPanes) {
    const name = document.getElementById("name").value.trim();
    const date = document.getElementById("birthdate").value;
    const groupId = document.getElementById("group").value;

    if (name === "" || date === "") {
        showNotification("Veuillez remplir tous les champs obligatoires.");
        return;
    }

    const newBirthday = {
        id: generateId(),
        name: name,
        date: date,
        groupId: groupId,
    };

    data.birthdays.push(newBirthday);
    saveData();

    formElement.reset();
    // Mettre à jour les différentes vues
    renderUpcomingBirthdays(birthdaysContainer);
    
    // Mettre à jour la chronologie si l'onglet est actif
    const timelinePane = document.getElementById("timeline");
    if (timelinePane.classList.contains("active")) {
        renderTimelineTab();
    }
    
    showNotification(`Anniversaire de "${name}" ajouté avec succès.`);

    // Retourner à l'onglet des anniversaires à venir
    switchTab("upcoming", tabButtons, tabPanes);
}

// Modifier un anniversaire
function editBirthday(id) {
    const birthday = data.birthdays.find((b) => b.id === id);
    if (!birthday) return;

    // Remplir le formulaire avec les données existantes
    document.getElementById("name").value = birthday.name;
    document.getElementById("birthdate").value = birthday.date;
    document.getElementById("group").value = birthday.groupId;

    // Supprimer l'anniversaire existant
    data.birthdays = data.birthdays.filter((b) => b.id !== id);

    // Passer à l'onglet d'ajout
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");
    switchTab("add", tabButtons, tabPanes);

    showNotification(
        `Modification de l'anniversaire de "${birthday.name}". Confirmez pour sauvegarder.`,
    );
}

// Supprimer un anniversaire
function deleteBirthday(id) {
    const birthday = data.birthdays.find((b) => b.id === id);
    if (!birthday) return;

    if (
        confirm(
            `Êtes-vous sûr de vouloir supprimer l'anniversaire de "${birthday.name}" ?`,
        )
    ) {
        data.birthdays = data.birthdays.filter((b) => b.id !== id);
        saveData();
        
        // Mettre à jour les différentes vues
        renderUpcomingBirthdays(document.getElementById("upcoming-birthdays"));
        
        // Mettre à jour la chronologie si l'onglet est actif
        const timelinePane = document.getElementById("timeline");
        if (timelinePane && timelinePane.classList.contains("active")) {
            renderTimelineTab();
        }
        
        showNotification(`Anniversaire de "${birthday.name}" supprimé.`);
    }
}

// Modifier un groupe
function editGroup(id) {
    const group = data.groups.find((g) => g.id === id);
    if (!group) return;

    const newName = prompt("Nouveau nom du groupe:", group.name);

    if (newName !== null && newName.trim() !== "") {
        group.name = newName.trim();
        saveData();
        renderGroups(document.getElementById("groups-list"));
        updateGroupOptions(document.getElementById("group"));
        updateTimelineGroupFilter(); // Mettre à jour le filtre de groupe dans la chronologie
        renderUpcomingBirthdays(document.getElementById("upcoming-birthdays"));
        
        // Mettre à jour la chronologie si l'onglet est actif
        const timelinePane = document.getElementById("timeline");
        if (timelinePane && timelinePane.classList.contains("active")) {
            renderTimelineView(document.querySelector("#month-view-btn").classList.contains("active") ? "month" : "season");
        }
        
        showNotification(`Groupe renommé en "${newName}".`);
    }
}

// Supprimer un groupe
function deleteGroup(id) {
    const group = data.groups.find((g) => g.id === id);
    if (!group) return;

    const hasBirthdays = data.birthdays.some((b) => b.groupId === id);

    let message = `Êtes-vous sûr de vouloir supprimer le groupe "${group.name}" ?`;
    if (hasBirthdays) {
        message +=
            " Tous les anniversaires associés à ce groupe seront également supprimés.";
    }

    if (confirm(message)) {
        data.groups = data.groups.filter((g) => g.id !== id);

        if (hasBirthdays) {
            data.birthdays = data.birthdays.filter((b) => b.groupId !== id);
        }

        saveData();
        renderGroups(document.getElementById("groups-list"));
        renderUpcomingBirthdays(document.getElementById("upcoming-birthdays"));
        updateGroupOptions(document.getElementById("group"));
        updateTimelineGroupFilter(); // Mettre à jour le filtre de groupe dans la chronologie
        
        // Mettre à jour la chronologie si l'onglet est actif
        const timelinePane = document.getElementById("timeline");
        if (timelinePane && timelinePane.classList.contains("active")) {
            renderTimelineView(document.querySelector("#month-view-btn").classList.contains("active") ? "month" : "season");
        }
        
        showNotification(`Groupe "${group.name}" supprimé.`);
    }
}

// Afficher les membres d'un groupe
function showGroupMembers(groupId) {
    const group = data.groups.find((g) => g.id === groupId);
    if (!group) return;

    const members = data.birthdays.filter((b) => b.groupId === groupId);

    let message = `Membres du groupe "${group.name}":\n\n`;

    if (members.length === 0) {
        message += "Aucun membre dans ce groupe.";
    } else {
        members.forEach((member) => {
            message += `- ${member.name} (${formatDate(member.date)})\n`;
        });
    }

    alert(message);
}

// Générer un ID unique
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Afficher une notification dans l'application
function showNotification(message) {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

// Demander la permission pour les notifications du navigateur
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("Ce navigateur ne prend pas en charge les notifications.");
        return;
    }

    if (
        Notification.permission !== "granted" &&
        Notification.permission !== "denied"
    ) {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                showNotification(
                    "Notifications activées ! Vous recevrez des alertes pour les anniversaires à venir.",
                );
            }
        });
    }
}

// Initialisation de l'onglet chronologie
function renderTimelineTab() {
    // Mettre à jour le filtre de groupe
    updateTimelineGroupFilter();

    // Afficher la vue par défaut (mois)
    renderTimelineView("month");
}

// Mettre à jour le filtre de groupe pour la chronologie
function updateTimelineGroupFilter() {
    const filterSelect = document.getElementById("timeline-group-filter");
    if (!filterSelect) return;

    let options = '<option value="">Tous les groupes</option>';
    data.groups.forEach((group) => {
        options += `<option value="${group.id}">${group.name}</option>`;
    });
    filterSelect.innerHTML = options;
}

// Afficher la chronologie selon le mode sélectionné
function renderTimelineView(viewMode) {
    const container = document.getElementById("timeline-container");
    if (!container) return;

    const selectedGroupId = document.getElementById(
        "timeline-group-filter",
    ).value;

    // Filtrer les anniversaires par groupe si nécessaire
    let filteredBirthdays = data.birthdays;
    if (selectedGroupId) {
        filteredBirthdays = data.birthdays.filter(
            (b) => b.groupId === selectedGroupId,
        );
    }

    if (filteredBirthdays.length === 0) {
        container.innerHTML =
            '<p class="no-birthdays-message">Aucun anniversaire trouvé.</p>';
        return;
    }

    // Trier les anniversaires par mois et jour
    const birthdays = [...filteredBirthdays].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        // Comparer d'abord le mois
        if (dateA.getMonth() !== dateB.getMonth()) {
            return dateA.getMonth() - dateB.getMonth();
        }

        // Si même mois, comparer le jour
        return dateA.getDate() - dateB.getDate();
    });

    if (viewMode === "month") {
        renderMonthView(container, birthdays);
    } else {
        renderSeasonView(container, birthdays);
    }
}

// Afficher la vue par mois
function renderMonthView(container, birthdays) {
    const months = [
        { id: 0, name: "Janvier" },
        { id: 1, name: "Février" },
        { id: 2, name: "Mars" },
        { id: 3, name: "Avril" },
        { id: 4, name: "Mai" },
        { id: 5, name: "Juin" },
        { id: 6, name: "Juillet" },
        { id: 7, name: "Août" },
        { id: 8, name: "Septembre" },
        { id: 9, name: "Octobre" },
        { id: 10, name: "Novembre" },
        { id: 11, name: "Décembre" },
    ];

    let html = '<div class="month-timeline">';

    months.forEach((month) => {
        const monthBirthdays = birthdays.filter((b) => {
            const date = new Date(b.date);
            return date.getMonth() === month.id;
        });

        html += `
            <div class="month-card">
                <h3>${month.name}</h3>
                ${
                    monthBirthdays.length > 0
                        ? '<div class="month-birthday-list">'
                        : '<p class="empty-message">Aucun anniversaire ce mois-ci</p>'
                }
        `;

        if (monthBirthdays.length > 0) {
            monthBirthdays
                .sort((a, b) => {
                    return (
                        new Date(a.date).getDate() - new Date(b.date).getDate()
                    );
                })
                .forEach((birthday) => {
                    const date = new Date(birthday.date);
                    const day = date.getDate();
                    const year = date.getFullYear();
                    const age = new Date().getFullYear() - year;
                    const month = date.getMonth() + 1;
                    const group = data.groups.find(
                        (g) => g.id === birthday.groupId,
                    );
                    const groupName = group ? group.name : "Sans groupe";

                    html += `
                    <div class="month-birthday-item">
                        <div>
                            <span class="name">${birthday.name}</span>
                            <span class="group-tag">${groupName}</span>
                        </div>
                        <div class="date">${day}/${month}</div>
                    </div>
                `;
                });

            html += "</div>";
        }

        html += "</div>";
    });

    html += "</div>";
    container.innerHTML = html;
}

// Afficher la vue par saison
function renderSeasonView(container, birthdays) {
    const seasons = [
        {
            id: "winter",
            name: "Hiver",
            months: [11, 0, 1], // Décembre, Janvier, Février
            icon: "❄️",
            class: "season-winter",
        },
        {
            id: "spring",
            name: "Printemps",
            months: [2, 3, 4], // Mars, Avril, Mai
            icon: "🌱",
            class: "season-spring",
        },
        {
            id: "summer",
            name: "Été",
            months: [5, 6, 7], // Juin, Juillet, Août
            icon: "☀️",
            class: "season-summer",
        },
        {
            id: "autumn",
            name: "Automne",
            months: [8, 9, 10], // Septembre, Octobre, Novembre
            icon: "🍂",
            class: "season-autumn",
        },
    ];

    // Obtenir la saison actuelle
    const currentMonth = new Date().getMonth();
    const currentSeason = seasons.find((season) =>
        season.months.includes(currentMonth),
    );

    // Réorganiser les saisons pour commencer par la saison actuelle
    const reorderedSeasons = [...seasons];
    const currentSeasonIndex = seasons.findIndex(
        (s) => s.id === currentSeason.id,
    );
    for (let i = 0; i < currentSeasonIndex; i++) {
        reorderedSeasons.push(reorderedSeasons.shift());
    }

    let html = '<div class="season-timeline">';

    reorderedSeasons.forEach((season) => {
        const seasonBirthdays = birthdays.filter((b) => {
            const date = new Date(b.date);
            return season.months.includes(date.getMonth());
        });

        html += `
            <div class="season-section ${season.class}">
                <h3><span class="season-icon">${season.icon}</span> ${season.name}</h3>
                ${
                    seasonBirthdays.length > 0
                        ? '<div class="season-birthday-list">'
                        : '<p class="empty-message">Aucun anniversaire cette saison</p>'
                }
        `;

        if (seasonBirthdays.length > 0) {
            // Trier par mois puis par jour
            seasonBirthdays
                .sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);

                    // D'abord par mois
                    if (dateA.getMonth() !== dateB.getMonth()) {
                        // Gestion spéciale pour l'hiver (Décembre = 11, Janvier = 0, Février = 1)
                        if (season.id === "winter") {
                            // Pour l'hiver, on veut l'ordre: Décembre, Janvier, Février
                            const monthOrderA =
                                dateA.getMonth() === 11
                                    ? 0
                                    : dateA.getMonth() + 1;
                            const monthOrderB =
                                dateB.getMonth() === 11
                                    ? 0
                                    : dateB.getMonth() + 1;
                            return monthOrderA - monthOrderB;
                        }

                        return dateA.getMonth() - dateB.getMonth();
                    }

                    // Ensuite par jour
                    return dateA.getDate() - dateB.getDate();
                })
                .forEach((birthday) => {
                    const date = new Date(birthday.date);
                    const day = date.getDate();
                    const month = date.getMonth() + 1; // Les mois commencent à 0
                    const year = date.getFullYear();
                    const age = new Date().getFullYear() - year;

                    const group = data.groups.find(
                        (g) => g.id === birthday.groupId,
                    );
                    const groupName = group ? group.name : "Sans groupe";

                    html += `
                    <div class="season-birthday-item">
                        <div>
                            <span class="name">${birthday.name}</span>
                            <span class="group-tag">${groupName}</span>
                        </div>
                        <div class="date">${day}/${month < 10 ? "0" + month : month} (${year}, ${age} ans)</div>
                    </div>
                `;
                });

            html += "</div>";
        }

        html += "</div>";
    });

    html += "</div>";
    container.innerHTML = html;
}

// Vérifier les anniversaires à venir et envoyer des notifications
function checkNotifications() {
    requestNotificationPermission();

    if (Notification.permission !== "granted") {
        return;
    }

    const sortedBirthdays = getSortedUpcomingBirthdays();

    // Vérifier si l'heure actuelle correspond à l'heure de notification configurée
    // Si ce n'est pas le cas, on vérifie toutes les heures, comme indiqué dans setInterval
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [notifHour, notifMinute] = notificationSettings.notificationTime
        .split(":")
        .map(Number);

    const isNotificationTime =
        currentHour === notifHour &&
        currentMinute >= notifMinute &&
        currentMinute < notifMinute + 5;

    // Parcourir tous les anniversaires
    sortedBirthdays.forEach((birthday) => {
        // Clé pour vérifier si une notification a déjà été envoyée aujourd'hui pour cet anniversaire
        const notificationKey = `notified_${birthday.id}_${now.toDateString()}`;
        const hasNotified = localStorage.getItem(notificationKey);

        // Ne pas envoyer de notification si déjà fait aujourd'hui
        if (hasNotified) {
            return;
        }

        let shouldNotify = false;
        let notificationMessage = "";

        // Le jour même
        if (birthday.daysUntil === 0 && notificationSettings.notifySameDay) {
            shouldNotify = true;
            notificationMessage = `C'est l'anniversaire de ${birthday.name} aujourd'hui !`;
        }
        // La veille
        else if (
            birthday.daysUntil === 1 &&
            notificationSettings.notifyDayBefore
        ) {
            shouldNotify = true;
            notificationMessage = `L'anniversaire de ${birthday.name} est demain !`;
        }
        // Trois jours avant
        else if (
            birthday.daysUntil === 3 &&
            notificationSettings.notifyThreeDays
        ) {
            shouldNotify = true;
            notificationMessage = `L'anniversaire de ${birthday.name} est dans 3 jours.`;
        }
        // Une semaine avant
        else if (birthday.daysUntil === 7 && notificationSettings.notifyWeek) {
            shouldNotify = true;
            notificationMessage = `L'anniversaire de ${birthday.name} est dans une semaine.`;
        }

        // Envoyer la notification si nécessaire et si c'est l'heure configurée (ou si test manuel déclenché)
        if (shouldNotify && (isNotificationTime || !hasNotified)) {
            // Trouver le groupe de la personne
            const group = data.groups.find((g) => g.id === birthday.groupId);
            const groupName = group ? group.name : "Sans groupe";

            // Créer la notification
            const notif = new Notification("Rappel d'anniversaire !", {
                body: `${notificationMessage} (Groupe: ${groupName})`,
                icon: "https://cdn.pixabay.com/photo/2012/04/01/17/29/birthday-23805_960_720.png",
            });

            // Marquer cette notification comme envoyée pour aujourd'hui
            localStorage.setItem(notificationKey, "true");

            // Supprimer ce marqueur après 24 heures pour permettre une notification le lendemain
            setTimeout(
                () => {
                    localStorage.removeItem(notificationKey);
                },
                24 * 60 * 60 * 1000,
            );

            // Ouvrir l'application au clic sur la notification
            notif.onclick = function (event) {
                event.preventDefault();
                window.focus();
                const tabButtons = document.querySelectorAll(".tab-btn");
                const tabPanes = document.querySelectorAll(".tab-pane");
                switchTab("upcoming", tabButtons, tabPanes);
            };
        }
    });
}

// Fonction pour sauvegarder les données dans le localStorage et dans le fichier JSON
function saveData() {
    try {
        // Sauvegarder dans le localStorage
        localStorage.setItem("birthdayData", JSON.stringify(data));
        console.log("Données sauvegardées dans le localStorage");
        
        // Sauvegarder dans le fichier JSON en temps réel via le serveur
        fetch('/save-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la sauvegarde du fichier JSON');
            }
            return response.json();
        })
        .then(result => {
            console.log("Données sauvegardées dans le fichier JSON:", result);
        })
        .catch(error => {
            console.error("Erreur lors de la sauvegarde dans le fichier:", error);
        });
        
        showNotification("Données sauvegardées avec succès");
        return true;
    } catch (error) {
        console.error("Erreur lors de la sauvegarde des données:", error);
        showNotification("Erreur de sauvegarde des données");
        return false;
    }
}

// Exporter les données vers un fichier JSON
function exportData() {
    try {
        // Créer un objet Blob contenant les données au format JSON
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });

        // Créer un URL pour ce blob
        const url = URL.createObjectURL(blob);

        // Créer un élément <a> pour déclencher le téléchargement
        const a = document.createElement("a");
        a.href = url;
        a.download = `anniversaires_${new Date().toISOString().slice(0, 10)}.json`;

        // Déclencher le téléchargement
        document.body.appendChild(a);
        a.click();

        // Nettoyer
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);

        showNotification("Données exportées avec succès");
    } catch (error) {
        console.error("Erreur lors de l'exportation des données:", error);
        showNotification("Erreur lors de l'exportation des données");
    }
}

// Importer les données depuis un fichier JSON
function importData(file) {
    try {
        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                const importedData = JSON.parse(event.target.result);

                // Vérifier que le format des données est correct
                if (!importedData.groups || !importedData.birthdays) {
                    throw new Error("Format de fichier invalide");
                }

                // Mettre à jour les données
                data = importedData;

                // Sauvegarder les données importées
                saveData();

                // Mettre à jour l'interface
                renderUpcomingBirthdays(
                    document.getElementById("upcoming-birthdays"),
                );
                renderGroups(document.getElementById("groups-list"));
                updateGroupOptions(document.getElementById("group"));

                showNotification("Données importées avec succès");

                // Retourner à l'onglet des anniversaires à venir
                const tabButtons = document.querySelectorAll(".tab-btn");
                const tabPanes = document.querySelectorAll(".tab-pane");
                switchTab("upcoming", tabButtons, tabPanes);
            } catch (e) {
                console.error("Erreur lors de l'analyse du fichier:", e);
                showNotification(
                    "Le fichier sélectionné n'est pas un fichier de données valide",
                );
            }
        };

        reader.onerror = function () {
            console.error("Erreur lors de la lecture du fichier");
            showNotification("Erreur lors de la lecture du fichier");
        };

        reader.readAsText(file);
    } catch (error) {
        console.error("Erreur lors de l'importation des données:", error);
        showNotification("Erreur lors de l'importation des données");
    }
}
