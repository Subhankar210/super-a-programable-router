import React, { useContext, useState, useEffect } from 'react'
import {
  Box,
  HStack,
  Radio,
  Stack,
  Icon,
  Image,
  Text,
  VStack,
  useBreakpointValue,
  useColorModeValue,
  SectionList,
  createIcon
} from 'native-base'

import { AlertContext } from 'layouts/Admin'
import TimeSeriesList from 'components/Traffic/TimeSeriesList'
import ClientSelect from 'components/ClientSelect'
import DateRange from 'components/DateRange'

import { deviceAPI, trafficAPI } from 'api'

const TrafficList = (props) => {
  const context = useContext(AlertContext)
  const regexLAN = /^192\.168\./

  const [list, setList] = useState([])
  const [listFiltered, setListFiltered] = useState([])
  const [type, setType] = useState('WanOut')
  const [filterIps, setFilterIps] = useState([])
  const [offset, setOffset] = useState('All Time')
  const [devices, setDevices] = useState({})

  // filter the list by type and ip
  const filterList = (data) => {
    // filter by ip
    if (filterIps && filterIps.length) {
      let field = type.match(/Out$/) ? 'Src' : 'Dst'
      data = data.filter((row) => filterIps.includes(row[field]))
    }

    // by type
    return data.filter((row) => {
      // src == lan && dst == lan

      //TODO diff between LanIn|Out on interface
      if (
        type == 'LanIn' &&
        row.Src.match(regexLAN) &&
        row.Dst.match(regexLAN)
      ) {
        return row
      }

      if (
        type == 'LanOut' &&
        row.Src.match(regexLAN) &&
        row.Dst.match(regexLAN)
      ) {
        return row
      }

      //if (type == 'WanIn' && row.Interface == 'wlan0') {
      if (
        type == 'WanIn' &&
        row.Dst.match(regexLAN) &&
        !row.Src.match(regexLAN)
      ) {
        return row
      }

      //if (type == 'WanOut' && row.Interface != 'wlan0') {
      if (
        type == 'WanOut' &&
        row.Src.match(regexLAN) &&
        !row.Dst.match(regexLAN)
      ) {
        return row
      }
    })
  }

  const refreshList = () => {
    trafficAPI
      .traffic()
      .then(async (data) => {
        // TODO merge list with previous & set expire=timeout if  theres a change in packets/bytes

        if (list.length) {
          data = data.map((row) => {
            let idx = list.findIndex(
              (prow) => prow.Src == row.Src && prow.Dst == row.Dst
            )

            if (idx < 0) {
              // new entry
            } else if (row.Packets > list[idx].Packets) {
              // time window here between each interval but we treat it as "just now"
              row.Expires = row.Timeout
            }

            return row
          })
        }

        data.sort((a, b) => b.Expires - a.Expires || b.Dst - a.Dst)
        setList(
          data.map((row) => {
            let msAgo = (row.Timeout - row.Expires) * 1e3
            row.Timestamp = new Date(new Date().getTime() - msAgo)

            // device to Src/Dst
            /*let dir = type.replace(/^(Wan|Lan)/, '')
            let ip = dir == 'Out' ? row.Src : row.Dst
            let key = `device` + (dir == 'Out' ? 'Src' : 'Dst')
            row[key] = Object.values(devices).find(
              (device) => device.RecentIP == ip
            )*/

            return row
          })
        )
      })
      .catch((err) => context.error(err))
  }

  useEffect(() => {
    if (!list.length) {
      return
    }

    setListFiltered(filterList(list))
  }, [devices, list, type])

  useEffect(() => {
    //deviceAPI.list().then((devices) => {
    //setDevices(devices)
    refreshList()
    //})

    const interval = setInterval(refreshList, 5 * 1e3)
    return () => clearInterval(interval)
  }, [])

  const flexDirection = useBreakpointValue({
    base: 'column',
    lg: 'row'
  })

  let types = ['WanOut', 'WanIn', 'LanIn', 'LanOut']

  const handleChangeClient = (ips) => {
    setFilterIps(ips)
  }

  return (
    <>
      <Box
        bg={useColorModeValue('backgroundCardLight', 'backgroundCardDark')}
        rounded={{ base: 'none', md: 'md' }}
        width="100%"
        p={4}
        mb={4}
      >
        <Stack direction={flexDirection} space={2}>
          <Radio.Group
            flex={1}
            name="trafficType"
            defaultValue={type}
            accessibilityLabel="select type"
            onChange={(type) => {
              setFilterIps([])
              setType(type)
            }}
          >
            <HStack alignItems="center" space={4}>
              {types.map((type) => (
                <Radio
                  key={type}
                  value={type}
                  colorScheme="primary"
                  size="sm"
                  my={1}
                >
                  {type.replace(/(In|Out)/, ' $1')}
                </Radio>
              ))}
            </HStack>
          </Radio.Group>
          <Box flex={1}>
            <ClientSelect
              isMultiple
              value={filterIps}
              onChange={handleChangeClient}
            />
          </Box>
        </Stack>
      </Box>
      <Box
        bg={useColorModeValue('backgroundCardLight', 'backgroundCardDark')}
        rounded={{ base: 'none', md: 'md' }}
        width="100%"
        p={4}
        mb={4}
      >
        <TimeSeriesList
          type={type}
          data={listFiltered}
          offset={offset}
          filterIps={filterIps}
          setFilterIps={setFilterIps}
        />
      </Box>
    </>
  )
}

export default TrafficList