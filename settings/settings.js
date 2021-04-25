/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

// tab 2 stuff here
function displayLogs(lines) {
	$('#loglines').html(lines);
}

function updateLogs() {
	try {
		displayLogs('');
		const showLogs = $('#show_logs').prop('checked');
		const showErrors = $('#show_errors').prop('checked');
		Homey.api('GET', 'getlogs/', null, (err, result) => {
			if (!err) {
				let lines = '';
				result
					.reverse()
					.forEach((line) => {
						if (!showLogs) {
							if (line.includes('[log]')) return;
						}
						if (!showErrors) {
							if (line.includes('[err]')) return;
						}
						let logLine = line
							.replace(' [MyApp]', '')
							.replace(' [ManagerDrivers]', '');
							// .replace(' [ts_ft002]', '');

						// find location string and replace with clickable link
						const locSearch = /coordinates.*?{ (.*?) }.*?/g;
						let m;
						while ((m = locSearch.exec(line)) !== null) {
							// This is necessary to avoid infinite loops with zero-width matches
							if (m.index === locSearch.lastIndex) {
								locSearch.lastIndex += 1;
							}
							const coordinates = m[1].split(', ');
							const lat = coordinates[0].replace(/latitude: /, '');
							const lon = coordinates[1].replace(/longitude: /, '');
							logLine = logLine.replace(`${m[0]}`, `<a href="http://maps.google.com/maps?q=loc:${lat},${lon}" target="_blank">link</a>`);
							// line = line.replace(`${m[0]}`, `<a href="http://www.osm.org/?mlat=${lat}&mlon=${lon}#map=13/$1" target="_blank">coordinates: $1</a>`);
						}

						lines += `${logLine}<br />`;
					});
				displayLogs(lines);
			} else {
				displayLogs(err);
			}
		});
	} catch (e) {
		displayLogs(e);
	}
}

function deleteLogs() {
	Homey.confirm(Homey.__('settings.tab2.deleteWarning'), 'warning', (error, result) => {
		if (result) {
			Homey.api('GET', 'deletelogs/', null, (err) => {
				if (err) {
					Homey.alert(err.message, 'error'); // [, String icon], Function callback )
				} else {
					Homey.alert(Homey.__('settings.tab2.deleted'), 'info');
					updateLogs();
				}
			});
		}
	});
}

// generic stuff here
function showTab(tab) {
	if (tab === 2) updateLogs();
	$('.tab').removeClass('tab-active');
	$('.tab').addClass('tab-inactive');
	$(`#tabb${tab}`).removeClass('tab-inactive');
	$(`#tabb${tab}`).addClass('active');
	$('.panel').hide();
	$(`#tab${tab}`).show();
}

function onHomeyReady(homeyReady) {
	Homey = homeyReady;
	showTab(1);
	Homey.ready();
}
