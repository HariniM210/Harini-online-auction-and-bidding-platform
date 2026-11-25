// Internal SQL fragment.
// Alias is chosen by server code, never by request input.

exports.detailStats = (alias, includeCount = true) => {
  if (alias !== 'l') {
    throw new Error('Invalid detail alias');
  }

  return `
    ${
      includeCount
        ? `(SELECT count(*)::int
            FROM public.bids
            WHERE auction_id = l.id) AS bid_count,`
        : ''
    }

    (
      SELECT count(DISTINCT bidder_id)::int
      FROM public.bids
      WHERE auction_id = l.id
    ) AS bidder_count,

    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', h.id::text,
            'amount', h.amount::text,
            'bid_time', h.bid_time,
            'bidder', 'Bidder ' || h.bidder_number
          )
          ORDER BY h.bid_time DESC, h.id DESC
        )
        FROM (
          SELECT
            id,
            amount,
            bid_time,
            dense_rank() OVER (
              ORDER BY bidder_id
            ) AS bidder_number
          FROM public.bids
          WHERE auction_id = l.id
          ORDER BY bid_time DESC, id DESC
          LIMIT 50
        ) h
      ),
      '[]'::jsonb
    ) AS bid_history
  `;
};