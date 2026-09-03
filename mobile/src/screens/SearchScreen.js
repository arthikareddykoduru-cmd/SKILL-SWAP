import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Search as SearchIcon, Filter, Star, MapPin, Send, X, MessageSquare } from 'lucide-react-native'
import { colors } from '../theme/colors'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { getSearchResults, sendConnectionRequest, getOrCreateConversation } from '../services/api'

const CATEGORIES = ['All', 'Coding', 'Design', 'Languages', 'Marketing', 'Music', 'Business']

export default function SearchScreen({ navigation }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)

  // Swap Request Modal State
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [swapNote, setSwapNote] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)

  const loadMentors = async () => {
    setLoading(true)
    try {
      const results = await getSearchResults(searchTerm, selectedCategory)
      setMentors(results)
    } catch (e) {
      console.error('Error loading mentors:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMentors()
  }, [selectedCategory])

  const handleSearchSubmit = () => {
    loadMentors()
  }

  const handleSendSwapRequest = async () => {
    if (!selectedMentor) return
    try {
      setSendingRequest(true)
      await sendConnectionRequest(selectedMentor.id, swapNote)
      Alert.alert('Request Sent!', `Your swap invitation has been sent to ${selectedMentor.name}.`)
      setSelectedMentor(null)
      setSwapNote('')
    } catch (e) {
      Alert.alert('Error', 'Failed to send swap request.')
    } finally {
      setSendingRequest(false)
    }
  }

  const handleStartChat = async (mentor) => {
    try {
      const convId = await getOrCreateConversation(mentor.id)
      if (convId) {
        navigation.navigate('Chat', { conversationId: convId, partner: mentor })
      }
    } catch (e) {
      console.error('Failed to open chat:', e)
    }
  }

  const renderMentorItem = ({ item }) => (
    <Card style={styles.mentorCard}>
      {/* Top Profile Info */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => navigation.navigate('UserProfileDetail', { userId: item.id, profile: item })}
        style={styles.profileRow}
      >
        <Avatar uri={item.avatar} name={item.name} size={50} />
        <View style={styles.profileInfo}>
          <Text style={styles.mentorName}>{item.name}</Text>
          <Text style={styles.mentorTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.ratingRow}>
            <Star size={13} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating} ({item.reviewsCount} reviews)</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <MapPin size={13} color={colors.textMuted} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Bio */}
      <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>

      {/* Skills */}
      <View style={styles.skillsSection}>
        <Text style={styles.skillsLabel}>Teaches:</Text>
        <View style={styles.badgesRow}>
          {item.skillsTeaching?.map((skill, idx) => (
            <Badge key={`teach-${idx}`} label={skill} type="teaching" size="sm" />
          ))}
        </View>
      </View>

      <View style={styles.skillsSection}>
        <Text style={[styles.skillsLabel, { color: '#818CF8' }]}>Wants to learn:</Text>
        <View style={styles.badgesRow}>
          {item.skillsLearning?.map((skill, idx) => (
            <Badge key={`learn-${idx}`} label={skill} type="learning" size="sm" />
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <Button
          title="Send Swap Request"
          onPress={() => setSelectedMentor(item)}
          variant="primary"
          size="sm"
          icon={<Send size={14} color="#06281E" />}
          style={{ flex: 1 }}
        />
        <Button
          title=""
          onPress={() => handleStartChat(item)}
          variant="secondary"
          size="sm"
          icon={<MessageSquare size={16} color={colors.text} />}
          style={{ width: 44, paddingHorizontal: 0 }}
        />
      </View>
    </Card>
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearchSubmit}
            placeholder="Search skills, topics, mentors..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchTerm(''); loadMentors(); }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories Bar */}
        <FlatList
          horizontal
          data={CATEGORIES}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(item)}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )
          }}
        />
      </View>

      {/* Mentors List */}
      <FlatList
        data={mentors}
        keyExtractor={(item) => item.id}
        renderItem={renderMentorItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon={<SearchIcon size={28} color={colors.primaryLight} />}
              title="No mentors found"
              description="Try searching for another skill like 'JavaScript', 'Design' or 'Spanish'."
            />
          )
        }
      />

      {/* Swap Request Modal */}
      <Modal
        visible={!!selectedMentor}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMentor(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Propose Skill Swap</Text>
              <TouchableOpacity onPress={() => setSelectedMentor(null)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Send a request to <Text style={{ color: colors.text, fontWeight: '700' }}>{selectedMentor?.name}</Text>
            </Text>

            <TextInput
              value={swapNote}
              onChangeText={setSwapNote}
              placeholder="Hi! I'd love to swap 1 hour of React for your UI Design advice..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              style={styles.modalInput}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setSelectedMentor(null)}
                variant="ghost"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Send Invitation"
                onPress={handleSendSwapRequest}
                loading={sendingRequest}
                variant="primary"
                size="md"
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  mentorCard: {
    marginBottom: 14,
  },
  profileRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  mentorName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  mentorTitle: {
    color: colors.textSecondary,
    fontSize: 12.5,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    color: colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  dotSeparator: {
    color: colors.textMuted,
  },
  locationText: {
    color: colors.textMuted,
    fontSize: 11.5,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  skillsSection: {
    marginBottom: 8,
  },
  skillsLabel: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.text,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 13.5,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  }
})
