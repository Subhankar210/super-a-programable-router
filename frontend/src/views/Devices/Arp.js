import React, { useContext, useEffect, useState } from 'react'
import { wifiAPI } from 'api'
import { AlertContext } from 'layouts/Admin'
import { AppContext } from 'AppContext'
import DeviceItem from 'components/Devices/DeviceItem'

import {
  Badge,
  BadgeText,
  FlatList,
  View,
  Box,
  Text,
  VStack
} from '@gluestack-ui/themed'

import { ListHeader, ListItem } from 'components/List'
import { InterfaceItem } from 'components/TagItem'

//import { FlashList } from '@shopify/flash-list'

const Arp = (props) => {
  const [list, setList] = useState()

  const alertContext = useContext(AlertContext)
  const context = useContext(AppContext)

  let translateFlags = (number) => {
    number = parseInt(number, 16)
    let translation = ''
    if ((number & 0x2) == 0x2) {
      translation += ' C'
    }

    if ((number & 0x4) == 4) {
      translation += ' PERM'
    }

    translation += ' (' + number + ')'

    return translation
  }

  const refreshList = async () => {
    let arp = await wifiAPI.arp().catch((error) => {
      this.alertContext.error('API Failure: ' + error.message)
    })

    arp = arp.sort((a, b) => {
      const num1 = Number(
        a.IP.split('.')
          .map((num) => `000${num}`.slice(-3))
          .join('')
      )
      const num2 = Number(
        b.IP.split('.')
          .map((num) => `000${num}`.slice(-3))
          .join('')
      )
      return num1 - num2
    })

    setList(arp)
  }

  useEffect(() => {
    refreshList()
  }, [])

  return (
    <View>
      <ListHeader title="ARP Table"></ListHeader>

      <FlatList
        data={list}
        estimatedItemSize={100}
        renderItem={({ item }) => (
          <ListItem>
            <VStack
              flex={2}
              minW="40%"
              sx={{ '@md': { flexDirection: 'row' } }}
              space={'md'}
              justifyContent="space-between"
            >
              <Text flex={1} size="sm" bold>
                {item.IP}
              </Text>
              <Text flex={2} size="sm" color="$muted500">
                {item.MAC}
              </Text>
              <DeviceItem flex={1} hideMissing={true} show={['Name']} item={context.getDevice(item.MAC, 'MAC')} />
            </VStack>
            <VStack
              flex={2}
              minW="40%"
              sx={{ '@md': { flexDirection: 'row' } }}
              space={'md'}
              justifyContent="space-between"
            >
              <Text size="xs">Flags: {translateFlags(item.Flags)}</Text>

              <InterfaceItem name={item.Device} />
            </VStack>
          </ListItem>
        )}
        keyExtractor={(item) => item.IP + item.Device}
      />
    </View>
  )
}

export default Arp
