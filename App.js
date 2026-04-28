import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { tyylit } from "./tyylit";

const API_AVAIN = "123";
const PERUS_URL = `https://www.thesportsdb.com/api/v1/json/${API_AVAIN}`;
const KAUSI = "2025-2026";

export default function App() {
  const [haku, asetaHaku] = useState("");
  const [joukkue, asetaJoukkue] = useState(null);
  const [viimeisetOttelut, asetaViimeisetOttelut] = useState([]);
  const [tulevatOttelut, asetaTulevatOttelut] = useState([]);
  const [sarjataulukko, asetaSarjataulukko] = useState([]);
  const [pelaajat, asetaPelaajat] = useState([]);
  const [valittuPelaaja, asetaValittuPelaaja] = useState(null);
  const [ladataan, asetaLadataan] = useState(false);
  const [virhe, asetaVirhe] = useState("");

  const lataaJoukkueenTiedot = async (joukkueNimi) => {
    try {
      asetaLadataan(true);
      asetaVirhe("");
      asetaValittuPelaaja(null);
      asetaViimeisetOttelut([]);
      asetaTulevatOttelut([]);
      asetaSarjataulukko([]);
      asetaPelaajat([]);

      const joukkueVastaus = await fetch(
        `${PERUS_URL}/searchteams.php?t=${encodeURIComponent(joukkueNimi)}`
      );
      const joukkueData = await joukkueVastaus.json();

      if (!joukkueData.teams || joukkueData.teams.length === 0) {
        asetaVirhe("Joukkuetta ei löytynyt.");
        return;
      }

      const loydettyJoukkue = joukkueData.teams[0];
      asetaJoukkue(loydettyJoukkue);
      asetaHaku(loydettyJoukkue.strTeam);

      const viimeisetVastaus = await fetch(
        `${PERUS_URL}/eventslast.php?id=${loydettyJoukkue.idTeam}`
      );
      const viimeisetData = await viimeisetVastaus.json();

      const tulevatVastaus = await fetch(
        `${PERUS_URL}/eventsnext.php?id=${loydettyJoukkue.idTeam}`
      );
      const tulevatData = await tulevatVastaus.json();

      asetaViimeisetOttelut((viimeisetData.results || []).slice(0, 10));
      asetaTulevatOttelut((tulevatData.events || []).slice(0, 10));

      if (loydettyJoukkue.idLeague) {
        const taulukkoVastaus = await fetch(
          `${PERUS_URL}/lookuptable.php?l=${loydettyJoukkue.idLeague}&s=${KAUSI}`
        );
        const taulukkoData = await taulukkoVastaus.json();
        asetaSarjataulukko(taulukkoData.table || []);
      }

      const pelaajatVastaus = await fetch(
        `${PERUS_URL}/lookup_all_players.php?id=${loydettyJoukkue.idTeam}`
      );
      const pelaajatData = await pelaajatVastaus.json();

      asetaPelaajat(pelaajatData.player || []);
    } catch (e) {
      console.log(e);
      asetaVirhe("Datan hakemisessa tapahtui virhe.");
    } finally {
      asetaLadataan(false);
    }
  };

  const haeJoukkue = async () => {
    if (!haku.trim()) {
      asetaVirhe("Kirjoita joukkueen nimi.");
      return;
    }

    await lataaJoukkueenTiedot(haku);
  };

  const renderoiOttelu = ({ item }) => {
    const koti = item.strHomeTeam || "Tuntematon";
    const vieras = item.strAwayTeam || "Tuntematon";

    const kotiTulos =
      item.intHomeScore !== null && item.intHomeScore !== undefined
        ? item.intHomeScore
        : "-";

    const vierasTulos =
      item.intAwayScore !== null && item.intAwayScore !== undefined
        ? item.intAwayScore
        : "-";

    return (
      <View style={tyylit.kortti}>
        <Text style={tyylit.otteluOtsikko}>
          {koti} vs {vieras}
        </Text>

        <Text style={tyylit.otteluTeksti}>
          Päivä: {item.dateEvent || "Ei tiedossa"}
        </Text>

        <Text style={tyylit.otteluTeksti}>
          Tulos: {kotiTulos} - {vierasTulos}
        </Text>

        <Text style={tyylit.otteluTeksti}>
          Liiga: {item.strLeague || "Ei tiedossa"}
        </Text>
      </View>
    );
  };

  const renderoiSarjataulukonRivi = ({ item }) => {
    const onValittuJoukkue =
      joukkue &&
      item.strTeam &&
      joukkue.strTeam &&
      item.strTeam.toLowerCase() === joukkue.strTeam.toLowerCase();

    return (
      <TouchableOpacity
        style={[
          tyylit.taulukkoRivi,
          onValittuJoukkue && tyylit.valittuJoukkueRivi,
        ]}
        onPress={() => lataaJoukkueenTiedot(item.strTeam)}
      >
        <Text style={tyylit.taulukkoSijoitus}>{item.intRank || "-"}</Text>

        <Text style={tyylit.taulukkoJoukkue} numberOfLines={1}>
          {item.strTeam || "Tuntematon"}
        </Text>

        <Text style={tyylit.taulukkoTilasto}>{item.intPlayed || "-"}</Text>
        <Text style={tyylit.taulukkoTilasto}>{item.intWin || "-"}</Text>
        <Text style={tyylit.taulukkoTilasto}>{item.intDraw || "-"}</Text>
        <Text style={tyylit.taulukkoTilasto}>{item.intLoss || "-"}</Text>
        <Text style={tyylit.taulukkoPisteet}>{item.intPoints || "-"}</Text>
      </TouchableOpacity>
    );
  };

  const renderoiPelaaja = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={tyylit.pelaajaRivi}
        onPress={() => asetaValittuPelaaja(item)}
      >
        <Text style={tyylit.pelaajaNumero}>{index + 1}.</Text>

        {item.strCutout || item.strThumb ? (
          <Image
            source={{ uri: item.strCutout || item.strThumb }}
            style={tyylit.pelaajaKuva}
          />
        ) : (
          <View style={tyylit.pelaajaKuvaPaikka}>
            <Text style={tyylit.pelaajaKuvaTeksti}>?</Text>
          </View>
        )}

        <View style={tyylit.pelaajaTiedot}>
          <Text style={tyylit.pelaajaNimi} numberOfLines={1}>
            {item.strPlayer || "Tuntematon pelaaja"}
          </Text>

          <Text style={tyylit.pelaajaTeksti}>
            Pelipaikka: {item.strPosition || "Ei tiedossa"}
          </Text>

          <Text style={tyylit.pelaajaTeksti}>
            Kansallisuus: {item.strNationality || "Ei tiedossa"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={tyylit.sailio}>
        <ScrollView contentContainerStyle={tyylit.vieritysSisalto}>
          <Text style={tyylit.otsikko}>Urheilutulokset</Text>

          <Text style={tyylit.alaotsikko}>
            Hae joukkueen tulokset, tulevat ottelut, sarjataulukko ja kokoonpano
          </Text>

          <View style={tyylit.hakuRivi}>
            <TextInput
              style={tyylit.syote}
              placeholder="Esim. Arsenal"
              value={haku}
              onChangeText={asetaHaku}
            />

            <TouchableOpacity style={tyylit.painike} onPress={haeJoukkue}>
              <Text style={tyylit.painikeTeksti}>Hae</Text>
            </TouchableOpacity>
          </View>

          {ladataan && <ActivityIndicator size="large" style={tyylit.lataus} />}

          {virhe ? <Text style={tyylit.virhe}>{virhe}</Text> : null}

          {joukkue && (
            <View style={tyylit.joukkueLaatikko}>
              {joukkue.strTeamBadge ? (
                <Image
                  source={{ uri: joukkue.strTeamBadge }}
                  style={tyylit.joukkueLogo}
                />
              ) : null}

              <Text style={tyylit.joukkueNimi}>{joukkue.strTeam}</Text>

              <Text style={tyylit.joukkueTieto}>
                Laji: {joukkue.strSport || "Ei tiedossa"}
              </Text>

              <Text style={tyylit.joukkueTieto}>
                Liiga: {joukkue.strLeague || "Ei tiedossa"}
              </Text>

              <Text style={tyylit.joukkueTieto}>
                Maa: {joukkue.strCountry || "Ei tiedossa"}
              </Text>
            </View>
          )}

          {valittuPelaaja && (
            <View style={tyylit.profiiliKortti}>
              {valittuPelaaja.strCutout || valittuPelaaja.strThumb ? (
                <Image
                  source={{
                    uri: valittuPelaaja.strCutout || valittuPelaaja.strThumb,
                  }}
                  style={tyylit.profiiliKuva}
                />
              ) : (
                <View style={tyylit.profiiliKuvaPaikka}>
                  <Text style={tyylit.profiiliKuvaTeksti}>?</Text>
                </View>
              )}

              <Text style={tyylit.profiiliNimi}>
                {valittuPelaaja.strPlayer || "Tuntematon pelaaja"}
              </Text>

              <Text style={tyylit.profiiliTeksti}>
                Joukkue: {valittuPelaaja.strTeam || "Ei tiedossa"}
              </Text>

              <Text style={tyylit.profiiliTeksti}>
                Pelipaikka: {valittuPelaaja.strPosition || "Ei tiedossa"}
              </Text>

              <Text style={tyylit.profiiliTeksti}>
                Kansallisuus: {valittuPelaaja.strNationality || "Ei tiedossa"}
              </Text>

              <Text style={tyylit.profiiliTeksti}>
                Syntymäaika: {valittuPelaaja.dateBorn || "Ei tiedossa"}
              </Text>

              <Text style={tyylit.profiiliTeksti}>
                Syntymäpaikka:{" "}
                {valittuPelaaja.strBirthLocation || "Ei tiedossa"}
              </Text>

              <Text style={tyylit.profiiliTeksti}>
                Pituus: {valittuPelaaja.strHeight || "Ei tiedossa"}
              </Text>

              <Text style={tyylit.profiiliTeksti}>
                Paino: {valittuPelaaja.strWeight || "Ei tiedossa"}
              </Text>

              <TouchableOpacity
                style={tyylit.suljePainike}
                onPress={() => asetaValittuPelaaja(null)}
              >
                <Text style={tyylit.suljePainikeTeksti}>Sulje profiili</Text>
              </TouchableOpacity>
            </View>
          )}

          {viimeisetOttelut.length > 0 && (
            <View style={tyylit.osio}>
              <Text style={tyylit.osioOtsikko}>
                Viimeisimmät ottelut ({viimeisetOttelut.length})
              </Text>

              <FlatList
                data={viimeisetOttelut}
                keyExtractor={(item) => item.idEvent}
                renderItem={renderoiOttelu}
                scrollEnabled={false}
              />
            </View>
          )}

          {tulevatOttelut.length > 0 && (
            <View style={tyylit.osio}>
              <Text style={tyylit.osioOtsikko}>
                Tulevat ottelut ({tulevatOttelut.length})
              </Text>

              <FlatList
                data={tulevatOttelut}
                keyExtractor={(item) => item.idEvent}
                renderItem={renderoiOttelu}
                scrollEnabled={false}
              />
            </View>
          )}

          {sarjataulukko.length > 0 && (
            <View style={tyylit.osio}>
              <Text style={tyylit.osioOtsikko}>
                Sarjataulukko {joukkue?.strLeague ? `- ${joukkue.strLeague}` : ""}
              </Text>

              <Text style={tyylit.ohjeTeksti}>
                Paina joukkuetta avataksesi sen tiedot.
              </Text>

              <View style={tyylit.taulukkoOtsake}>
                <Text style={tyylit.taulukkoSijoitus}>#</Text>
                <Text style={tyylit.taulukkoJoukkue}>Joukkue</Text>
                <Text style={tyylit.taulukkoTilasto}>O</Text>
                <Text style={tyylit.taulukkoTilasto}>V</Text>
                <Text style={tyylit.taulukkoTilasto}>T</Text>
                <Text style={tyylit.taulukkoTilasto}>H</Text>
                <Text style={tyylit.taulukkoPisteet}>P</Text>
              </View>

              <FlatList
                data={sarjataulukko}
                keyExtractor={(item, index) =>
                  item.idStanding ? item.idStanding : index.toString()
                }
                renderItem={renderoiSarjataulukonRivi}
                scrollEnabled={false}
              />
            </View>
          )}

          {pelaajat.length > 0 && (
            <View style={tyylit.osio}>
              <Text style={tyylit.osioOtsikko}>
                Joukkueen kokoonpano ({pelaajat.length})
              </Text>

              <Text style={tyylit.ohjeTeksti}>
                Paina pelaajaa nähdäksesi tarkemmat tiedot.
              </Text>

              <FlatList
                data={pelaajat}
                keyExtractor={(item, index) =>
                  item.idPlayer ? item.idPlayer : index.toString()
                }
                renderItem={renderoiPelaaja}
                scrollEnabled={false}
              />
            </View>
          )}

          {joukkue && sarjataulukko.length === 0 && !ladataan && !virhe && (
            <Text style={tyylit.infoTeksti}>
              Sarjataulukkoa ei löytynyt tälle sarjalle tai kaudelle.
            </Text>
          )}

          {joukkue && pelaajat.length === 0 && !ladataan && !virhe && (
            <Text style={tyylit.infoTeksti}>
              Kokoonpanoa ei löytynyt tälle joukkueelle.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}