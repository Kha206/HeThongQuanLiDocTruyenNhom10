import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import HomeScreen from '../screens/HomeScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import StoryDetailScreen from '../screens/StoryDetailScreen';
import ChapterReaderScreen from '../screens/ChapterReaderScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import AccountScreen from '../screens/AccountScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import InAppNotificationBanner from '../components/InAppNotificationBanner';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F0F14' }
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="StoryDetail" component={StoryDetailScreen} />
      <HomeStack.Screen name="ChapterReader" component={ChapterReaderScreen} />
      <HomeStack.Screen name="Subscriptions" component={SubscriptionsScreen} />
      <HomeStack.Screen name="ComingSoon" component={ComingSoonScreen} />
    </HomeStack.Navigator>
  );
}

function MainTabNavigator() {
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A22',
          borderTopColor: '#2A2A38',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#ED1D24',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_600SemiBold',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'NotificationTab') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'AccountTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size || 22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Kho Truyện' }}
      />
      <Tab.Screen
        name="NotificationTab"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Thông Báo',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ED1D24',
            color: '#FFFFFF',
            fontSize: 10,
            fontFamily: 'Outfit_700Bold',
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            lineHeight: 16
          }
        }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{ tabBarLabel: 'Tài Khoản' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigationRef = useNavigationContainerRef();

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.marvelBadge}>
          <Text style={styles.marvelBadgeText}>MARVEL</Text>
        </View>
        <Text style={styles.splashTitle}>COMICS HUB</Text>
        <ActivityIndicator size="large" color="#ED1D24" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <InAppNotificationBanner navigationRef={navigationRef} />
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Main' : 'Login'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F0F14' }
        }}
      >
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="ChapterReader" component={ChapterReaderScreen} />
        <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
        <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="ProfileEdit"
          component={ProfileEditScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0F0F14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marvelBadge: {
    backgroundColor: '#ED1D24',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  marvelBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 26,
    letterSpacing: 2,
    fontFamily: 'Outfit_700Bold',
  },
  splashTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Italiana_400Regular',
    letterSpacing: 3,
  },
});
