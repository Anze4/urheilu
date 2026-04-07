import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";

const API_KEY = "123";
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

export default function App() {
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState(null);
  const [lastEvents, setLastEvents] = useState([]);
  const [nextEvents, setNextEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchTeam = async () => {
    if (!search.trim()) {
      setError("Kirjoita joukkueen nimi.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setTeam(null);
      setLastEvents([]);
      setNextEvents([]);

      // 1. Haetaan joukkue
      const teamResponse = await fetch(
        `${BASE_URL}/searchteams.php?t=${encodeURIComponent(search)}`
      );
      const teamData = await teamResponse.json();

      if (!teamData.teams || teamData.teams.length === 0) {
        setError("Joukkuetta ei löytynyt.");
        setLoading(false);
        return;
      }

      const foundTeam = teamData.teams[0];
      setTeam(foundTeam);

      // 2. Haetaan viimeisimmät ottelut
      const lastResponse = await fetch(
        `${BASE_URL}/eventslast.php?id=${foundTeam.idTeam}`
      );
      const lastData = await lastResponse.json();

      // 3. Haetaan tulevat ottelut
      const nextResponse = await fetch(
        `${BASE_URL}/eventsnext.php?id=${foundTeam.idTeam}`
      );
      const nextData = await nextResponse.json();

      setLastEvents(lastData.results || []);
      setNextEvents(nextData.events || []);
    } catch (err) {
      setError("Datan hakemisessa tapahtui virhe.");
    } finally {
      setLoading(false);
    }
  };

  const renderEvent = ({ item }) => {
    const home = item.strHomeTeam || "Tuntematon";
    const away = item.strAwayTeam || "Tuntematon";

    const homeScore =
      item.intHomeScore !== null && item.intHomeScore !== undefined
        ? item.intHomeScore
        : "-";

    const awayScore =
      item.intAwayScore !== null && item.intAwayScore !== undefined
        ? item.intAwayScore
        : "-";

    return (
      <View style={styles.card}>
        <Text style={styles.eventTitle}>
          {home} vs {away}
        </Text>
        <Text style={styles.eventText}>Päivä: {item.dateEvent || "Ei tiedossa"}</Text>
        <Text style={styles.eventText}>
          Tulos: {homeScore} - {awayScore}
        </Text>
        <Text style={styles.eventText}>
          Liiga: {item.strLeague || "Ei tiedossa"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Urheilutulokset</Text>
        <Text style={styles.subtitle}>
          Hae joukkueen viimeisimmät ja tulevat ottelut
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Esim. Arsenal"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.button} onPress={searchTeam}>
            <Text style={styles.buttonText}>Hae</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" style={styles.loader} />}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {team && (
          <View style={styles.teamBox}>
            {team.strTeamBadge ? (
              <Image source={{ uri: team.strTeamBadge }} style={styles.badge} />
            ) : null}
            <Text style={styles.teamName}>{team.strTeam}</Text>
            <Text style={styles.teamInfo}>Laji: {team.strSport || "Ei tiedossa"}</Text>
            <Text style={styles.teamInfo}>Liiga: {team.strLeague || "Ei tiedossa"}</Text>
            <Text style={styles.teamInfo}>
              Maa: {team.strCountry || "Ei tiedossa"}
            </Text>
          </View>
        )}

        {lastEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Viimeisimmät ottelut</Text>
            <FlatList
              data={lastEvents}
              keyExtractor={(item) => item.idEvent}
              renderItem={renderEvent}
              scrollEnabled={false}
            />
          </View>
        )}

        {nextEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tulevat ottelut</Text>
            <FlatList
              data={nextEvents}
              keyExtractor={(item) => item.idEvent}
              renderItem={renderEvent}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  button: {
    backgroundColor: "#222",
    paddingHorizontal: 18,
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  loader: {
    marginVertical: 20,
  },
  error: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
  teamName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  teamInfo: {
    fontSize: 15,
    marginBottom: 4,
    color: "#444",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  eventText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 2,
  },
});