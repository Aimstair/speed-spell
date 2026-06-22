import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStore, CustomList } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { playClick } from '../utils/audio';
import { CustomAlertModal, CustomAlertButton } from '../components/CustomAlertModal';
import { ms, scaleY } from '../utils/scale';

const BACK_ARROW = '\u2190';
const PLUS = '+';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomLists'>;

export const CustomListsScreen: React.FC<Props> = ({ navigation }) => {
  const { customLists, saveCustomList, deleteCustomList, settings } = useStore();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newWord, setNewWord] = useState('');
  
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<CustomAlertButton[]>([]);

  const showAlert = (title: string, message: string, buttons?: CustomAlertButton[]) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons || [{ text: "OK", onPress: () => setAlertVisible(false) }]);
    setAlertVisible(true);
  };

  const activeList = customLists.find(l => l.id === activeListId);

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const newList: CustomList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      words: []
    };
    saveCustomList(newList);
    setNewListName('');
    playClick(settings.sfx);
  };

  const handleAddWord = () => {
    if (!newWord.trim() || !activeList) return;
    const wordClean = newWord.trim().toLowerCase();
    if (activeList.words.includes(wordClean)) {
      showAlert('Duplicate Word', 'This word is already in your list.');
      return;
    }
    const updatedList = { ...activeList, words: [...activeList.words, wordClean] };
    saveCustomList(updatedList);
    setNewWord('');
    playClick(settings.sfx);
  };

  const handleRemoveWord = (word: string) => {
    if (!activeList) return;
    const updatedList = { ...activeList, words: activeList.words.filter(w => w !== word) };
    saveCustomList(updatedList);
    playClick(settings.sfx);
  };

  const handleDeleteList = () => {
    if (!activeListId) return;
    showAlert(
      "Delete List",
      "Are you sure you want to delete this list?",
      [
        { text: "Cancel", style: "cancel", onPress: () => setAlertVisible(false) },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteCustomList(activeListId);
            setActiveListId(null);
            playClick(settings.sfx);
            setAlertVisible(false);
          } 
        }
      ]
    );
  };

  const handlePlay = () => {
    if (!activeList || activeList.words.length === 0) {
      showAlert('Empty List', 'Add some words to this list before playing.');
      return;
    }
    playClick(settings.sfx);
    navigation.navigate('Game', { mode: 'custom', difficulty: 'Intermediate', customListId: activeList.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { playClick(settings.sfx); activeListId ? setActiveListId(null) : navigation.goBack(); }}>
            <Text style={styles.backButton}>{BACK_ARROW}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{activeList ? activeList.name.toUpperCase() : 'CUSTOM LISTS'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {!activeList ? (
            <>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="New list name..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={newListName}
                  onChangeText={setNewListName}
                  maxLength={20}
                  returnKeyType="done"
                  onSubmitEditing={handleCreateList}
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleCreateList}>
                  <Text style={styles.addBtnText}>{PLUS}</Text>
                </TouchableOpacity>
              </View>

              {customLists.length === 0 ? (
                <Text style={styles.emptyText}>Create your first custom spelling list above!</Text>
              ) : (
                customLists.map(list => (
                  <TouchableOpacity 
                    key={list.id} 
                    style={styles.listItem}
                    onPress={() => { playClick(settings.sfx); setActiveListId(list.id); }}
                  >
                    <Text style={styles.listName}>{list.name}</Text>
                    <Text style={styles.listCount}>{list.words.length} words {'>'}</Text>
                  </TouchableOpacity>
                ))
              )}
            </>
          ) : (
            <>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.playBtn} onPress={handlePlay}>
                  <Text style={styles.playBtnText}>PLAY THIS LIST</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteList}>
                  <Text style={styles.deleteBtnText}>DELETE</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Add a word..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={newWord}
                  onChangeText={setNewWord}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={25}
                  returnKeyType="done"
                  onSubmitEditing={handleAddWord}
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddWord}>
                  <Text style={styles.addBtnText}>{PLUS}</Text>
                </TouchableOpacity>
              </View>

              {activeList.words.length === 0 ? (
                <Text style={styles.emptyText}>No words yet. Add some words above!</Text>
              ) : (
                activeList.words.map((word, idx) => (
                  <View key={idx} style={styles.wordRow}>
                    <Text style={styles.wordText}>{word}</Text>
                    <TouchableOpacity onPress={() => handleRemoveWord(word)}>
                      <Text style={styles.removeText}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onDismiss={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: ms(20), paddingTop: scaleY(10), paddingBottom: scaleY(5),
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { paddingRight: ms(20) },
  backButton: { fontSize: ms(24), color: COLORS.black, paddingBottom: scaleY(10) },
  headerTitle: { ...TYPOGRAPHY.subtitle, flex: 1 },
  content: { padding: ms(20) },
  inputRow: { flexDirection: 'row', marginBottom: 20 },
  input: {
    flex: 1, borderBottomWidth: 2, borderBottomColor: COLORS.black,
    ...TYPOGRAPHY.h3, paddingVertical: 10, fontSize: ms(18),
    color: COLORS.black
  },
  addBtn: {
    width: 50, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.black, marginLeft: 10, borderRadius: 4
  },
  addBtnText: { color: COLORS.white, fontSize: 24, fontWeight: 'bold' },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginTop: 20, textAlign: 'center' },
  listItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border
  },
  listName: { ...TYPOGRAPHY.h2, fontSize: ms(20) },
  listCount: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  playBtn: { flex: 2, backgroundColor: COLORS.green, padding: 15, borderRadius: 8, alignItems: 'center' },
  playBtnText: { ...TYPOGRAPHY.subtitle, color: COLORS.black },
  deleteBtn: { flex: 1, backgroundColor: COLORS.red, padding: 15, borderRadius: 8, alignItems: 'center' },
  deleteBtnText: { ...TYPOGRAPHY.subtitle, color: COLORS.white },
  wordRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border
  },
  wordText: { ...TYPOGRAPHY.h3, fontSize: ms(18) },
  removeText: { ...TYPOGRAPHY.h3, color: COLORS.red, paddingHorizontal: 10 }
});
