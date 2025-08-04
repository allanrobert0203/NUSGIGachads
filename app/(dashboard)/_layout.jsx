import { Tabs } from "expo-router"
import { useColorScheme } from "react-native"
import { Colors } from "../../constants/Colors"
import { Ionicons } from "@expo/vector-icons"

import UserOnly from "../../components/auth/UserOnly"

export default function DashboardLayout() {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  return (
    <UserOnly>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.navBackground, paddingTop: 10, height: 90, position: 'absolute', borderTopColor: '#8000FF', borderTopWidth: 2, shadowColor: '#8000FF', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 15,},
        tabBarActiveTintColor: theme.iconColorFocused,
        tabBarInactiveTintColor: theme.iconColor,
      }}
    >
      <Tabs.Screen 
        name="profile"
        options={{ 
          title: "Profile", 
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              size={24} 
              name={focused ? 'person-circle' : 'person-circle-outline'} 
              color={focused ? '#B380FF' : theme.iconColor}
              style={focused ? {
                shadowColor: '#B380FF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 10,
                elevation: 10,
              } : null}
            />
          ) 
        }}
      />

      <Tabs.Screen 
        name="books"
        options={{ 
          title: "Jobs", 
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              size={24} 
              name={focused ? 'briefcase' : 'briefcase-outline'} 
              color={focused ? '#B380FF' : theme.iconColor}
              style={focused ? {
                shadowColor: '#B380FF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 10,
                elevation: 10,
              } : null}
            />
          ) 
        }} 
      />
      
      <Tabs.Screen 
        name="create"
        options={{ 
          title: "Create", 
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              size={24} 
              name={focused ? 'create' : 'create-outline'} 
              color={focused ? '#B380FF' : theme.iconColor}
              style={focused ? {
                shadowColor: '#B380FF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 10,
                elevation: 10,
              } : null}
            />
          ) 
        }} 
      />

      <Tabs.Screen 
        name="messages"
        options={{ 
          title: "Messages", 
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              size={24} 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              color={focused ? '#B380FF' : theme.iconColor}
              style={focused ? {
                shadowColor: '#B380FF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 10,
                elevation: 10,
              } : null}
            />
          ) 
        }} 
      />

      <Tabs.Screen 
        name="orders"
        options={{ 
          title: "Orders", 
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              size={24} 
              name={focused ? 'receipt' : 'receipt-outline'} 
              color={focused ? '#B380FF' : theme.iconColor}
              style={focused ? {
                shadowColor: '#B380FF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 10,
                elevation: 10,
              } : null}
            />
          ) 
        }} 
      />

      <Tabs.Screen 
        name="search"
        options={{ 
          title: "Search", 
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              size={24} 
              name={focused ? 'search' : 'search-outline'} 
              color={focused ? '#B380FF' : theme.iconColor}
              style={focused ? {
                shadowColor: '#B380FF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 10,
                elevation: 10,
              } : null}
            />
          ) 
        }} 
      />

      <Tabs.Screen name="books/[id]" options={{href:null}} />
      <Tabs.Screen name="messages/[id]" options={{href:null}} />
    </Tabs>
    </UserOnly>
  )
}