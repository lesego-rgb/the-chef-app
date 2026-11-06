import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chef-menu-items-v1";
const COURSES = ["Starter", "Main Course", "Dessert", "Drink"];
const STARTER_DATA = [
  { id: "sample-1", name: "Creamy Tomato Soup", description: "Slow-cooked tomato soup with fresh herbs.", course: "Starter", price: 65 },
  { id: "sample-2", name: "Herb Grilled Chicken", description: "Grilled chicken served with seasonal vegetables.", course: "Main Course", price: 145 },
  { id: "sample-3", name: "Chocolate Lava Cake", description: "Warm chocolate cake with a soft centre.", course: "Dessert", price: 75 }
];
const formatPrice = value => `R${Number(value).toFixed(2)}`;

export default function App() {
  const [items, setItems] = useState(STARTER_DATA);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState("menu");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) setItems(JSON.parse(saved));
      } catch {
        Alert.alert("Storage notice", "Saved menu data could not be loaded. You can still use the app.");
      } finally { setLoaded(true); }
    })();
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() =>
      Alert.alert("Save error", "Your changes could not be saved on this device.")
    );
  }, [items, loaded]);

  const stats = useMemo(() => {
    const average = items.length ? items.reduce((sum, item) => sum + Number(item.price), 0) / items.length : 0;
    return { total: items.length, average, counts: Object.fromEntries(COURSES.map(c => [c, items.filter(i => i.course === c).length])) };
  }, [items]);

  const visibleItems = useMemo(() => items.filter(item =>
    (filter === "All" || item.course === filter) &&
    `${item.name} ${item.description}`.toLowerCase().includes(search.trim().toLowerCase())
  ), [items, filter, search]);

  function resetForm() {
    setEditingId(null); setName(""); setDescription(""); setCourse(""); setPrice("");
  }
  function openAdd() { resetForm(); setScreen("form"); }
  function openEdit(item) {
    setEditingId(item.id); setName(item.name); setDescription(item.description);
    setCourse(item.course); setPrice(String(item.price)); setScreen("form");
  }
  function saveItem() {
    const numericPrice = Number(price);
    if (!name.trim() || !description.trim() || !course || !price.trim()) {
      Alert.alert("Missing information", "Please complete all fields before saving."); return;
    }
    if (!COURSES.includes(course)) {
      Alert.alert("Invalid course", "Please select a course from the list."); return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      Alert.alert("Invalid price", "Enter a price greater than R0.00."); return;
    }
    if (editingId) {
      setItems(current => current.map(item => item.id === editingId
        ? { ...item, name: name.trim(), description: description.trim(), course, price: numericPrice } : item));
      Alert.alert("Success", "Menu item updated successfully.");
    } else {
      setItems(current => [...current, { id: `${Date.now()}`, name: name.trim(), description: description.trim(), course, price: numericPrice }]);
      Alert.alert("Success", "Menu item added successfully.");
    }
    resetForm(); setScreen("menu");
  }
  function deleteItem(item) {
    Alert.alert("Delete menu item", `Are you sure you want to delete "${item.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        setItems(current => current.filter(entry => entry.id !== item.id));
        Alert.alert("Deleted", "Menu item deleted successfully.");
      }}
    ]);
  }

  const Header = () => (
    <View style={styles.header}>
      <View style={styles.logo}><Text style={styles.logoText}>CM</Text></View>
      <View style={{ flex: 1 }}><Text style={styles.headerTitle}>Chef Menu Manager</Text><Text style={styles.headerSub}>RESTAURANT WORKSPACE</Text></View>
      <TouchableOpacity onPress={() => setScreen("menu")}><Text style={styles.homeLink}>MENU</Text></TouchableOpacity>
    </View>
  );
  const Stat = ({ label, value }) => (
    <View style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7f3" />
      <Header />
      {screen === "menu" ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>YOUR RESTAURANT AT A GLANCE</Text>
          <Text style={styles.pageTitle}>Menu dashboard</Text>
          <Text style={styles.subtitle}>Manage your dishes and keep your menu organised.</Text>
          <View style={styles.statsGrid}>
            <Stat label="TOTAL ITEMS" value={stats.total} />
            <Stat label="AVERAGE PRICE" value={formatPrice(stats.average)} />
          </View>
          <Text style={styles.sectionTitle}>Items by course</Text>
          <View style={styles.courseStats}>
            {COURSES.map(c => <View key={c} style={styles.courseStat}><Text style={styles.courseStatLabel}>{c}</Text><Text style={styles.courseStatValue}>{stats.counts[c]}</Text></View>)}
          </View>
          <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Your menu items</Text><TouchableOpacity style={styles.addButton} onPress={openAdd}><Text style={styles.addButtonText}>＋ Add item</Text></TouchableOpacity></View>
          <TextInput style={styles.search} value={search} onChangeText={setSearch} placeholder="Search dish or description..." placeholderTextColor="#849087" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
            {["All", ...COURSES].map(c => <TouchableOpacity key={c} onPress={() => setFilter(c)} style={[styles.filterChip, filter === c && styles.filterActive]}><Text style={[styles.filterText, filter === c && styles.filterTextActive]}>{c}</Text></TouchableOpacity>)}
          </ScrollView>
          {visibleItems.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyIcon}>🍽</Text><Text style={styles.emptyTitle}>No menu items found</Text><Text style={styles.subtitle}>Try another search or add a menu item.</Text></View>
          ) : visibleItems.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTop}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemPrice}>{formatPrice(item.price)}</Text></View>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <View style={styles.itemBottom}><Text style={styles.tag}>{item.course}</Text><View style={styles.itemActions}>
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.smallButton}><Text style={styles.smallButtonText}>Edit</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => deleteItem(item)} style={[styles.smallButton, styles.deleteButton]}><Text style={[styles.smallButtonText, styles.deleteText]}>Delete</Text></TouchableOpacity>
              </View></View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => { resetForm(); setScreen("menu"); }}><Text style={styles.back}>‹ Back to menu</Text></TouchableOpacity>
            <Text style={styles.eyebrow}>MENU DETAILS</Text>
            <Text style={styles.pageTitle}>{editingId ? "Edit menu item" : "Add menu item"}</Text>
            <Text style={styles.subtitle}>Enter the dish information below.</Text>
            <View style={styles.formCard}>
              <Text style={styles.label}>Dish name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Grilled chicken" maxLength={60} />
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} placeholder="Describe the dish..." multiline maxLength={180} />
              <Text style={styles.label}>Course</Text>
              <View style={styles.courseOptions}>{COURSES.map(c => <TouchableOpacity key={c} onPress={() => setCourse(c)} style={[styles.courseOption, course === c && styles.courseOptionActive]}><Text style={[styles.courseOptionText, course === c && styles.courseOptionTextActive]}>{c}</Text></TouchableOpacity>)}</View>
              <Text style={styles.label}>Price (ZAR)</Text>
              <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="e.g. 125.00" keyboardType="decimal-pad" />
              <TouchableOpacity style={styles.saveButton} onPress={saveItem}><Text style={styles.saveButtonText}>{editingId ? "Save changes" : "Save menu item"}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { resetForm(); setScreen("menu"); }}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#f5f7f3"},header:{height:70,paddingHorizontal:18,flexDirection:"row",alignItems:"center",backgroundColor:"#fff",borderBottomWidth:1,borderBottomColor:"#e6ebe5",gap:11},
  logo:{width:39,height:39,borderRadius:11,backgroundColor:"#244b3b",alignItems:"center",justifyContent:"center"},logoText:{color:"#fff",fontWeight:"800"},headerTitle:{fontWeight:"700",fontSize:15,color:"#202923"},headerSub:{fontSize:9,letterSpacing:1.2,color:"#78847c",marginTop:3},homeLink:{fontSize:11,fontWeight:"800",color:"#244b3b"},
  content:{padding:19,paddingBottom:45},eyebrow:{fontSize:10,letterSpacing:1.5,fontWeight:"800",color:"#78847c",marginBottom:8},pageTitle:{fontSize:29,fontWeight:"800",color:"#202923"},subtitle:{fontSize:13,color:"#78847c",lineHeight:20,marginTop:5,marginBottom:18},
  statsGrid:{flexDirection:"row",gap:11,marginBottom:21},stat:{flex:1,backgroundColor:"#fff",borderWidth:1,borderColor:"#e6ebe5",borderRadius:13,padding:15},statLabel:{fontSize:9,color:"#78847c",fontWeight:"800",letterSpacing:.8},statValue:{fontSize:23,fontWeight:"800",color:"#244b3b",marginTop:9},
  sectionTitle:{fontSize:18,fontWeight:"800",color:"#202923",marginBottom:12},courseStats:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:23},courseStat:{width:"48%",backgroundColor:"#e5eee6",borderRadius:10,padding:12},courseStatLabel:{fontSize:11,color:"#456451"},courseStatValue:{fontSize:22,fontWeight:"800",color:"#244b3b",marginTop:4},
  sectionRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:10},addButton:{backgroundColor:"#244b3b",paddingVertical:10,paddingHorizontal:12,borderRadius:8},addButtonText:{color:"#fff",fontSize:12,fontWeight:"700"},
  search:{backgroundColor:"#fff",borderWidth:1,borderColor:"#e2e8e1",borderRadius:9,padding:12,fontSize:13,marginBottom:10},filters:{marginBottom:13},filterChip:{paddingVertical:8,paddingHorizontal:12,borderRadius:20,backgroundColor:"#e9eee8",marginRight:7},filterActive:{backgroundColor:"#244b3b"},filterText:{fontSize:11,color:"#526057"},filterTextActive:{color:"#fff",fontWeight:"700"},
  itemCard:{backgroundColor:"#fff",borderWidth:1,borderColor:"#e6ebe5",borderRadius:12,padding:14,marginBottom:10},itemTop:{flexDirection:"row",justifyContent:"space-between",gap:10},itemName:{fontSize:15,fontWeight:"800",color:"#202923",flex:1},itemPrice:{fontSize:14,fontWeight:"800",color:"#244b3b"},itemDescription:{fontSize:12,color:"#78847c",lineHeight:18,marginTop:7},itemBottom:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:12},tag:{fontSize:10,color:"#244b3b",backgroundColor:"#e5eee6",overflow:"hidden",paddingVertical:6,paddingHorizontal:9,borderRadius:15},itemActions:{flexDirection:"row",gap:7},smallButton:{paddingVertical:7,paddingHorizontal:11,borderRadius:7,backgroundColor:"#edf1ed"},smallButtonText:{fontSize:11,fontWeight:"700",color:"#244b3b"},deleteButton:{backgroundColor:"#faeeee"},deleteText:{color:"#b64242"},
  empty:{alignItems:"center",padding:30,backgroundColor:"#fff",borderRadius:12},emptyIcon:{fontSize:30},emptyTitle:{fontSize:16,fontWeight:"800",marginTop:8,color:"#202923"},back:{color:"#244b3b",fontWeight:"700",marginBottom:22,fontSize:13},
  formCard:{backgroundColor:"#fff",padding:17,borderRadius:13,borderWidth:1,borderColor:"#e6ebe5"},label:{fontSize:12,fontWeight:"700",color:"#47544c",marginTop:12,marginBottom:7},input:{borderWidth:1,borderColor:"#dfe5df",borderRadius:8,padding:12,fontSize:13,color:"#202923"},multiline:{height:90,textAlignVertical:"top"},courseOptions:{flexDirection:"row",flexWrap:"wrap",gap:7},courseOption:{borderWidth:1,borderColor:"#dfe5df",borderRadius:18,paddingVertical:8,paddingHorizontal:10},courseOptionActive:{backgroundColor:"#244b3b",borderColor:"#244b3b"},courseOptionText:{fontSize:11,color:"#526057"},courseOptionTextActive:{color:"#fff",fontWeight:"700"},
  saveButton:{backgroundColor:"#244b3b",padding:14,borderRadius:9,alignItems:"center",marginTop:23},saveButtonText:{color:"#fff",fontWeight:"800",fontSize:13},cancelButton:{padding:13,alignItems:"center"},cancelText:{color:"#66736a",fontWeight:"700",fontSize:12}
});
