import React, { useEffect, useState } from 'react';
import { useRouter } from "next/router";
import StripeCheckout from "react-stripe-checkout";
import useRequest from '../../hooks/useRequest'

const OrderShow = ({ order, currentUser }) => {
  const [ timeLeft, setTimeLeft ] = useState(0)
  const router = useRouter()

  const { doRequest, errors } = useRequest({
    url: '/api/payments',
    method: 'post',
    body: {
      orderId: order.id
    },
    onSuccess: (payment) => router.push('/orders')
  })

  useEffect(() => {
    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt) - new Date()
      setTimeLeft(msLeft / 1000)
    }

    findTimeLeft()
    const timerId = setInterval(findTimeLeft, 1000)

    return () => {
      clearInterval(timerId)
    }
  }, [])


  if ( timeLeft < 0 ) {
    return <div>Order Expired</div>
  }

  return (
    <div>
      {`Time left to pay: ${timeLeft} seconds`}
      <StripeCheckout
        token={({ id }) => doRequest({ token: id })}
        stripeKey="pk_test_51IrOheBnRRyJbzlCiWzhtQDDRVOZySQBB5o69jhygKIWiKiCnek5n3SBz9AbJpGRvINognv0WXqpP2UVsnGzFuaS00qh7Rocqd"
        amount={order.ticket.price * 100}
        email={currentUser.email}
      />
      {errors}
    </div>
  );
};

OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query
  const { data } = await client.get(`/api/orders/${orderId}`)
  
  return { order: data }
}

export default OrderShow;