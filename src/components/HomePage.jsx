import React, { useState } from "react"

import { Typography, Row, Col, Statistic } from "antd"
import { Select } from "antd"
import { Link, useNavigate } from "react-router-dom"

import {
  useGetStationRiverNameQuery,
  useGetValueFromStationReferenceQuery,
  useGetStationByQualifierQuery,
} from "../services/floodApi"
import { useEffect } from "react"
import RiverLabelData from "./riverData"
import GroundwaterAndTidalData from "./GroundwaterAndTidalData"
import Loader from "./Loader"
import { useDispatch } from "react-redux"
import {
  setContent,
  setFloodAlert,
  setNotification,
  setStations,
  setStationsNull,
} from "../app/slices/notificationSlice"
import axios from "axios"
import { BASE_URL } from "../constants/utils"

const { Text, Title } = Typography
const { Option } = Select

const HomePage = () => {
  const [qualifier, setQualifier] = useState("")
  const [river, setRiver] = useState("")
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(null)
  const [dbSubscription, setDbSubscription] = useState(null)
  const [allRivers, setAllRivers] = useState(new Set())
  const [nearbyRiver, setNearbyRiver] = useState(null)
  const [isUpdateLive, setIsUpdateLive] = useState(false)

  const { data: stationInfoFromRiver, isFetching } =
    useGetStationRiverNameQuery("")

  const navigate = useNavigate()
  const dispatch = useDispatch()
  // console.log(stationInfoFromRiver)
  const token = localStorage.getItem("token")
  useEffect(() => {
    if (!token) {
      navigate("/login")
    }
  })

  const getNearyByLocation = async () => {
    const token = localStorage.getItem("token")

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
    if (token) {
      try {
        const { data } = await axios.get(`user/nearby-location`, config)
        console.log(data, "== data")
        if (data.river) {
          setNearbyRiver({
            river: data.river,
            exists: true,
          })
        } else {
          setNearbyRiver({
            exists: false,
            msg: data.msg,
          })
        }
      } catch (error) {
        console.log(error)
      }
    }
  }
  useEffect(() => {
    getNearyByLocation()
  }, [])

  let { data: selectedRiver, isFetching: fetchingRiverInformation } =
    useGetStationRiverNameQuery(river, { skip: river === "" })
  console.log("== Selected river: ", selectedRiver)

  useEffect(() => {
    if (selectedRiver) {
      console.log("Selected River From Effect Home", selectedRiver.items)
    }
  }, [selectedRiver])

  const { data: groundWaterAndTidal, isFetching: fetchingTidalAndGroundWater } =
    useGetStationByQualifierQuery(qualifier, { skip: qualifier === "" })

  useEffect(() => {
    if (token && isUpdateLive) {
      navigator.geolocation.getCurrentPosition((position) => {
        console.log("== Latitude is :", position.coords.latitude)
        console.log("== Longitude is :", position.coords.longitude)
        axios
          .post(
            `user/update-location`,
            {
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          .then((res) => {
            console.log("Location Updated")
          })
          .catch((err) => {
            console.log(err)
          })
      })
    }
  }, [isUpdateLive])

  useEffect(() => {
    localStorage.getItem("isUpdateLive") === "true"
      ? setIsUpdateLive(true)
      : setIsUpdateLive(false)
  }, [])

  const getSubscription = async () => {
    setSubscriptionLoading(true)
    if (token) {
      try {
        const response = await axios.get(`user/get-subscription`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setDbSubscription(response.data.subscription)
        setSubscriptionLoading(false)
        return response.data.subscribed
      } catch (error) {
        console.log(error)
        setSubscriptionLoading(false)
      }
    }
  }

  useEffect(() => {
    getSubscription()
  }, [])

  const updateSubscription = async () => {
    setSubscriptionLoading(true)
    try {
      const response = await axios.post(
        `user/subscribe-for-notifications`,
        {
          subscription: subscribed,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setSubscriptionLoading(false)
      setDbSubscription(response.data.subscription)
      console.log(response.data.msg)
    } catch (error) {
      console.log(error)
      setSubscriptionLoading(false)
    }
  }
  const onChangeCheck = (e) => {
    console.log(e.target.checked)
    setSubscribed(e.target.checked)
  }

  useEffect(() => {
    if (subscribed === true || subscribed === false) {
      updateSubscription()
    }
  }, [subscribed])

  const onChange = (value) => {
    dispatch(setContent(null))
    dispatch(setFloodAlert(false))
    dispatch(setNotification(false))
    dispatch(setStationsNull([]))
    setRiver(value)
  }

  const onSearch = (value) => {
    console.log("search:", value)
  }

  const onChangeQualifier = (value) => {
    setQualifier(value)
  }

  const onSearchQualifier = (value) => {
    console.log("search:", value)
  }

  const grounwaterAndTidalInfo = groundWaterAndTidal?.items.map(
    (item, index) => {
      return <GroundwaterAndTidalData index={index} item={item} />
    }
  )

  const labelInfo = selectedRiver?.items.map((item, index) => {
    // console.log("== loop", index)
    // Last iteration of the loop
    let lastIndex = selectedRiver?.items.length - 1

    return (
      <RiverLabelData
        lastOne={index === lastIndex ? true : false}
        lastIndex={lastIndex}
        currentIndex={index}
        index={index}
        item={item}
        river={river}
      />
    )
  })

  if (isFetching) {
    return <Loader />
  } else if (allRivers.size === 0) {
    let rivers = new Set()
    stationInfoFromRiver?.items.map((item, index) => {
      if (item.riverName !== undefined) {
        rivers.add(item.riverName)
      }
    })
    setAllRivers(rivers)
  }

  return (
    <>
      <label htmlFor="myCheckLive">
        <input
          checked={isUpdateLive}
          onChange={() => {
            localStorage.setItem("isUpdateLive", !isUpdateLive)
            setIsUpdateLive(!isUpdateLive)
          }}
          type="checkbox"
          id="myCheckLive"
        />
        <span className="ml-3">Do you want to update your live Location?</span>
      </label>
      <Title level={2} className="heading">
        Flood Stats
      </Title>
      <Row>
        <Col span={12}>
          <Statistic title="The Number of Rivers" value={allRivers.size} />
        </Col>
        <Col span={12}>
          <Statistic
            title="The Number of Stations"
            value={stationInfoFromRiver?.items.length}
          />
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <label htmlFor="myCheck">
            <input
              checked={dbSubscription}
              onChange={onChangeCheck}
              type="checkbox"
              id="myCheck"
            />
            <span className="ml-3">
              Do you want to get Email Notifications for Live location?
            </span>
          </label>

          {nearbyRiver ? (
            nearbyRiver.exists ? (
              <>
                <p>
                  You are near to the{" "}
                  <b className="text-primary">
                    {nearbyRiver.river[0].properties.river}
                  </b>
                  , and water level is{" "}
                  <b className="text-primary fw-bold">
                    {nearbyRiver.river[0].properties.value}
                  </b>
                  , by dated at{" "}
                  <b className="text-primary">
                    {nearbyRiver.river[0].properties.value_date.split("T")[0]}
                  </b>
                </p>
              </>
            ) : (
              <>
                <h4>{nearbyRiver.msg}</h4>
              </>
            )
          ) : null}
        </Col>
      </Row>
      <div className="home-heading-container">
        <Title level={2} className="home-title">
          Rivers, Groundwater and Tidal Level In the UK
        </Title>
        <Title level={3} className="show-more">
          <Link to="/map-view">Show more</Link>
        </Title>
      </div>

      <div className="home-heading container">
        <Title level={2} className="home-title" />
      </div>
      <div>
        <Col>
          <Select
            showSearch
            placeholder="Select a river"
            optionFilterProp="children"
            onChange={onChange}
            onSearch={onSearch}
            listHeight={330}
          >
            {Array.from(allRivers).map((item) => (
              <Option key={item} value={item}>
                {item}
              </Option>
            ))}
          </Select>{" "}
          <br></br>
          <br></br>
          <Select
            showSearch
            placeholder="Select a type"
            optionFilterProp="children"
            onChange={onChangeQualifier}
            onSearch={onSearchQualifier}
            listHeight={330}
          >
            <Option value="Groundwater">Groundwater</Option>
            <Option value="Tidal Level">Tidal Level</Option>
          </Select>
        </Col>
        <Row>
          {river && (
            <Title>
              Selected River Stations
              <br />
            </Title>
          )}
        </Row>
        <Row gutter={[24, 24]}>
          {fetchingRiverInformation ? <Loader /> : labelInfo}
        </Row>
        <Row>
          {qualifier && (
            <Title>
              {qualifier} Stations
              <br />
            </Title>
          )}
        </Row>
        <Row gutter={[24, 24]}>
          {fetchingTidalAndGroundWater ? <Loader /> : grounwaterAndTidalInfo}
        </Row>
      </div>
    </>
  )
}

export default HomePage
