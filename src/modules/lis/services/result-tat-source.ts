/** Priority reference shape attached to an order (code used for TAT bucketing). */
export type OrderPriorityLike = { code: string | null; name: string | null };

/** Release timestamp shape on a result (validated date preferred, updatedAt fallback). */
export type ResultReleaseLike = {
  validatedDate: Date | string | null;
  updatedAt: Date | string;
};

/**
 * Minimal result shape the TAT calculator needs — satisfied by ResultEntity
 * loaded with its orderItem/order/priority and orderItem/testDefinition relations.
 */
export type ResultTatSource = {
  id?: string;
  status?: string | null;
  value?: string | null;
  validatedDate?: Date | string | null;
  updatedAt?: Date | string | null;
  orderItem?: {
    id?: string;
    testDefinition?: {
      tatRoutineMinutes?: number | null;
      tatStatMinutes?: number | null;
      tatEmergencyMinutes?: number | null;
    } | null;
    order?: {
      id?: string;
      orderNumber?: string;
      createdAt?: Date | string | null;
      requestedDate?: Date | string | null;
      priority?: OrderPriorityLike | null;
    } | null;
  } | null;
};
