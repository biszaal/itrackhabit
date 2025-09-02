import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { theme } from '../../theme';
import {
  NeumorphCard,
  NeumorphInput,
  NeumorphButton,
  NeumorphismColors,
} from '../../components/neumorphism';

type ContactSelectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ContactSelection'>;

interface Props {
  navigation: ContactSelectionScreenNavigationProp;
}

interface Contact {
  id: string;
  name: string;
  phoneNumbers?: { number: string; label?: string }[];
  emails?: { email: string; label?: string }[];
}

interface SelectedContact extends Contact {
  selected: boolean;
  invitationType: 'sms' | 'email';
}

export const ContactSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    requestContactsPermission();
  }, []);

  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        await loadContacts();
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      setHasPermission(false);
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
      });

      // Filter contacts that have either phone numbers or emails
      const validContacts = data
        .filter(contact => 
          contact.name && 
          (
            (contact.phoneNumbers && contact.phoneNumbers.length > 0) ||
            (contact.emails && contact.emails.length > 0)
          )
        )
        .map(contact => ({
          id: contact.id,
          name: contact.name,
          phoneNumbers: contact.phoneNumbers?.map(phone => ({
            number: phone.number || '',
            label: phone.label,
          })),
          emails: contact.emails?.map(email => ({
            email: email.email || '',
            label: email.label,
          })),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setContacts(validContacts.filter(c => c.id) as Contact[]);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleContactSelection = (contact: Contact) => {
    const existingIndex = selectedContacts.findIndex(c => c.id === contact.id);
    
    if (existingIndex >= 0) {
      // Remove from selected
      setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
    } else {
      // Add to selected - prefer SMS if phone available, otherwise email
      const preferredType: 'sms' | 'email' = 
        (contact.phoneNumbers && contact.phoneNumbers.length > 0) ? 'sms' : 'email';
      
      setSelectedContacts(prev => [...prev, {
        ...contact,
        selected: true,
        invitationType: preferredType,
      }]);
    }
  };

  const changeInvitationType = (contactId: string, type: 'sms' | 'email') => {
    setSelectedContacts(prev => 
      prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, invitationType: type }
          : contact
      )
    );
  };

  const sendInvitations = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select contacts to invite');
      return;
    }

    const invitationMessage = 
      `Hey! 👋 I'm using iTrackHabit to build better habits and I think you'd love it too! ` +
      `It has a beautiful neumorphic design and helps track habits with smart timers and analytics. ` +
      `Download it here: [App Store/Google Play Link]`;

    try {
      // Group contacts by invitation type
      const smsContacts = selectedContacts.filter(c => c.invitationType === 'sms');
      const emailContacts = selectedContacts.filter(c => c.invitationType === 'email');

      let successCount = 0;

      // Send SMS invitations
      if (smsContacts.length > 0) {
        for (const contact of smsContacts) {
          const phoneNumber = contact.phoneNumbers?.[0]?.number;
          if (phoneNumber) {
            const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(invitationMessage)}`;
            const canOpen = await Linking.canOpenURL(smsUrl);
            
            if (canOpen) {
              await Linking.openURL(smsUrl);
              successCount++;
            }
          }
        }
      }

      // Send email invitations using Share API (more reliable than direct email links)
      if (emailContacts.length > 0) {
        const emailList = emailContacts
          .map(c => c.emails?.[0]?.email)
          .filter(email => email)
          .join(', ');

        if (emailList) {
          try {
            await Share.share({
              message: `${invitationMessage}\n\nSent to: ${emailList}`,
              title: 'Join me on iTrackHabit!',
            });
            successCount += emailContacts.length;
          } catch (shareError) {
            console.error('Share error:', shareError);
          }
        }
      }

      if (successCount > 0) {
        Alert.alert(
          'Invitations Sent!',
          `Successfully sent ${successCount} invitation${successCount === 1 ? '' : 's'}`,
          [
            {
              text: 'Done',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to send invitations. Please try again.');
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      Alert.alert('Error', 'Failed to send invitations');
    }
  };

  const isSelected = (contactId: string) => {
    return selectedContacts.some(c => c.id === contactId);
  };

  const getSelectedContact = (contactId: string) => {
    return selectedContacts.find(c => c.id === contactId);
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const selected = isSelected(item.id);
    const selectedContact = getSelectedContact(item.id);
    const hasPhone = item.phoneNumbers && item.phoneNumbers.length > 0;
    const hasEmail = item.emails && item.emails.length > 0;

    return (
      <NeumorphCard
        variant="subtle"
        colorType={selected ? "primaryGlass" : "whiteGlass"}
        style={styles.contactCard}
        onPress={() => toggleContactSelection(item)}
        animated={true}
      >
        <View style={styles.contactInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{item.name}</Text>
            <View style={styles.contactMethods}>
              {hasPhone && (
                <View style={styles.methodBadge}>
                  <Ionicons name="call" size={12} color={theme.colors.textSecondary} />
                  <Text style={styles.methodText}>SMS</Text>
                </View>
              )}
              {hasEmail && (
                <View style={styles.methodBadge}>
                  <Ionicons name="mail" size={12} color={theme.colors.textSecondary} />
                  <Text style={styles.methodText}>Email</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.contactActions}>
          {selected && selectedContact && (hasPhone && hasEmail) && (
            <View style={styles.inviteTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.inviteTypeButton,
                  selectedContact.invitationType === 'sms' && styles.inviteTypeButtonActive
                ]}
                onPress={() => changeInvitationType(item.id, 'sms')}
              >
                <Ionicons 
                  name="call" 
                  size={14} 
                  color={selectedContact.invitationType === 'sms' ? theme.colors.white : theme.colors.textSecondary} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.inviteTypeButton,
                  selectedContact.invitationType === 'email' && styles.inviteTypeButtonActive
                ]}
                onPress={() => changeInvitationType(item.id, 'email')}
              >
                <Ionicons 
                  name="mail" 
                  size={14} 
                  color={selectedContact.invitationType === 'email' ? theme.colors.white : theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected && <Ionicons name="checkmark" size={18} color={theme.colors.white} />}
          </View>
        </View>
      </NeumorphCard>
    );
  };

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: NeumorphismColors.background }]}>
        <SafeAreaView style={styles.container}>
          <View style={styles.permissionContainer}>
            <NeumorphCard
              variant="convex"
              size="large"
              style={styles.permissionCard}
            >
              <Ionicons name="person-circle-outline" size={64} color={theme.colors.textMuted} />
              <Text style={styles.permissionTitle}>Contacts Access Required</Text>
              <Text style={styles.permissionText}>
                To invite friends from your contacts, we need access to your contacts list.
              </Text>
              <NeumorphButton
                title="Grant Permission"
                variant="primary"
                size="large"
                onPress={requestContactsPermission}
                glassIntensity="strong"
                style={styles.permissionButton}
              />
            </NeumorphCard>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <SafeAreaView style={styles.container}>
        <NeumorphCard
          variant="medium"
          colorType="whiteGlass"
          style={styles.header}
          animated={true}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invite Friends</Text>
          <View style={styles.headerRight}>
            {selectedContacts.length > 0 && (
              <NeumorphButton
                title={`Invite ${selectedContacts.length}`}
                variant="primary"
                size="small"
                onPress={sendInvitations}
                glassIntensity="strong"
                style={styles.inviteButton}
              />
            )}
          </View>
        </NeumorphCard>

        <NeumorphCard
          variant="light"
          colorType="whiteGlass"
          style={styles.searchCard}
          animated={true}
        >
          <NeumorphInput
            placeholder="Search contacts"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            glassIntensity="subtle"
          />
        </NeumorphCard>

        <FlatList
          data={filteredContacts}
          keyExtractor={item => item.id}
          renderItem={renderContact}
          style={styles.contactsList}
          contentContainerStyle={styles.contactsListContent}
          showsVerticalScrollIndicator={false}
        />

        {selectedContacts.length > 0 && (
          <NeumorphCard
            variant="medium"
            colorType="primaryGlass"
            style={styles.selectedBar}
            animated={true}
          >
            <Text style={styles.selectedText}>
              {selectedContacts.length} contact{selectedContacts.length === 1 ? '' : 's'} selected
            </Text>
            <NeumorphButton
              title="Send Invites"
              variant="primary"
              size="medium"
              onPress={sendInvitations}
              glassIntensity="strong"
            />
          </NeumorphCard>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  inviteButton: {
    paddingHorizontal: theme.spacing.sm,
  },
  searchCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  contactsListContent: {
    paddingBottom: 100,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  contactMethods: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  methodText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  inviteTypeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    padding: 2,
  },
  inviteTypeButton: {
    padding: theme.spacing.xs,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  inviteTypeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  selectedText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  permissionCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    maxWidth: 320,
  },
  permissionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  permissionButton: {
    width: '100%',
  },
});