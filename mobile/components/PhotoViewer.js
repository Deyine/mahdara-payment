import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PhotoViewer({ photos, visible, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!photos || photos.length === 0) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <SafeAreaView style={styles.container}>
        {/* Close button */}
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        {/* Counter */}
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>

        {/* Photo carousel */}
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(index);
          }}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: item.url }}
                style={styles.photo}
                resizeMode="contain"
              />
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  counter: {
    position: 'absolute',
    top: 55,
    alignSelf: 'center',
    zIndex: 10,
  },
  counterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoContainer: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
});
