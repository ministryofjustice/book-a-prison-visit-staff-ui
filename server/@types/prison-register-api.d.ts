/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  '/secure/prisons/id/{prisonId}/videolink-conferencing-centre/email-address': {
    /** Get a prison's Videolink Conferencing Centre email address */
    get: operations['getEmailForVideoConferencingCentre']
    /** Set or change a prison's Videolink Conferencing Centre email address */
    put: operations['putEmailAddressForVideolinkConferencingCentre']
    /** Remove a prison's Videolink Conferencing Centre email address */
    delete: operations['deleteEmailAddressForVideolinkConferencingCentre']
  }
  '/secure/prisons/id/{prisonId}/offender-management-unit/email-address': {
    /** Get a prison's Offender Management Unit email address */
    get: operations['getEmailForOffenderManagementUnit']
    /** Set or change a prison's Offender Management Unit email address */
    put: operations['putEmailAddressForOffenderManagementUnit']
    /** Remove a prison's Offender Management Unit email address */
    delete: operations['deleteEmailAddressForOffenderManagementUnit']
  }
  '/queue-admin/retry-dlq/{dlqName}': {
    put: operations['retryDlq']
  }
  '/queue-admin/retry-all-dlqs': {
    put: operations['retryAllDlqs']
  }
  '/queue-admin/purge-queue/{queueName}': {
    put: operations['purgeQueue']
  }
  '/prison-maintenance/id/{prisonId}': {
    /**
     * Update specified prison details
     * @description Updates prison information, role required is MAINTAIN_REF_DATA
     */
    put: operations['updatePrison']
  }
  '/prison-maintenance/id/{prisonId}/address/{addressId}': {
    /**
     * Update specified address details
     * @description Updates address information, role required is MAINTAIN_REF_DATA
     */
    put: operations['updateAddress']
    /**
     * Delete specified address for specified Prison
     * @description Deletes address information for a Prison, role required is MAINTAIN_REF_DATA
     */
    delete: operations['deleteAddress']
  }
  '/prison-maintenance': {
    /**
     * Adds a new prison
     * @description Adds new prison information, role required is MAINTAIN_REF_DATA
     */
    post: operations['insertPrison']
  }
  '/prison-maintenance/id/{prisonId}/address': {
    /**
     * Add Address to existing Prison
     * @description Adds an additional Address to an existing Prison, role required is MAINTAIN_REF_DATA
     */
    post: operations['addAddress']
  }
  '/queue-admin/get-dlq-messages/{dlqName}': {
    get: operations['getDlqMessages']
  }
  '/prisons': {
    /**
     * Get all prisons
     * @description All prisons
     */
    get: operations['getPrisons']
  }
  '/prisons/search': {
    /**
     * Get prisons from active and text search
     * @description All prisons
     */
    get: operations['getPrisonsBySearchFilter']
  }
  '/prisons/id/{prisonId}': {
    /**
     * Get specified prison
     * @description Information on a specific prison
     */
    get: operations['getPrisonFromId']
  }
  '/prisons/id/{prisonId}/address/{addressId}': {
    /**
     * Get specified prison
     * @description Information on a specific prison address
     */
    get: operations['getAddressFromId']
  }
  '/gp/prison/{prisonId}': {
    /** Get GP practice code about specified prison */
    get: operations['getPrisonFromId_1']
  }
  '/gp/practice/{gpPracticeCode}': {
    /** Get specified prison from GP practice code */
    get: operations['getPrisonFromGpPrescriber']
  }
}

export type webhooks = Record<string, never>

export interface components {
  schemas: {
    Message: {
      messageId?: string
      receiptHandle?: string
      body?: string
      attributes?: {
        [key: string]: string | undefined
      }
      messageAttributes?: {
        [key: string]: components['schemas']['MessageAttributeValue'] | undefined
      }
      md5OfBody?: string
      md5OfMessageAttributes?: string
    }
    MessageAttributeValue: {
      stringValue?: string
      binaryValue?: {
        /** Format: int32 */
        short?: number
        char?: string
        /** Format: int32 */
        int?: number
        /** Format: int64 */
        long?: number
        /** Format: float */
        float?: number
        /** Format: double */
        double?: number
        direct?: boolean
        readOnly?: boolean
      }
      stringListValues?: string[]
      binaryListValues?: {
        /** Format: int32 */
        short?: number
        char?: string
        /** Format: int32 */
        int?: number
        /** Format: int64 */
        long?: number
        /** Format: float */
        float?: number
        /** Format: double */
        double?: number
        direct?: boolean
        readOnly?: boolean
      }[]
      dataType?: string
    }
    RetryDlqResult: {
      /** Format: int32 */
      messagesFoundCount: number
      messages: components['schemas']['Message'][]
    }
    PurgeQueueResult: {
      /** Format: int32 */
      messagesFoundCount: number
    }
    /** @description Prison Update Record */
    UpdatePrisonDto: {
      /**
       * @description Name of the prison
       * @example HMP Moorland
       */
      prisonName: string
      /** @description Whether the prison is still active */
      active: boolean
      /** @description If this is a male prison */
      male?: boolean
      /** @description If this is a female prison */
      female?: boolean
      /** @description If this is a contracted prison */
      contracted?: boolean
      /** @description Set of types for this prison */
      prisonTypes?: ('HMP' | 'YOI' | 'IRC' | 'STC' | 'YCS')[]
    }
    ErrorResponse: {
      /** Format: int32 */
      status: number
      /** Format: int32 */
      errorCode?: number
      userMessage?: string
      developerMessage?: string
      moreInfo?: string
    }
    /** @description List of address for this prison */
    AddressDto: {
      /**
       * Format: int64
       * @description Unique ID of the address
       * @example 10000
       */
      id: number
      /**
       * @description Address line 1
       * @example Bawtry Road
       */
      addressLine1?: string
      /**
       * @description Address line 2
       * @example Hatfield Woodhouse
       */
      addressLine2?: string
      /**
       * @description Village/Town/City
       * @example Doncaster
       */
      town: string
      /**
       * @description County
       * @example South Yorkshire
       */
      county?: string
      /**
       * @description Postcode
       * @example DN7 6BW
       */
      postcode: string
      /**
       * @description Country
       * @example England
       */
      country: string
    }
    /** @description Prison Information */
    PrisonDto: {
      /**
       * @description Prison ID
       * @example MDI
       */
      prisonId: string
      /**
       * @description Name of the prison
       * @example Moorland HMP
       */
      prisonName: string
      /** @description Whether the prison is still active */
      active: boolean
      /** @description Whether the prison has male prisoners */
      male?: boolean
      /** @description Whether the prison has female prisoners */
      female?: boolean
      /** @description Whether the prison is contracted */
      contracted?: boolean
      /** @description List of types for this prison */
      types?: components['schemas']['PrisonTypeDto'][]
      /** @description List of address for this prison */
      addresses?: components['schemas']['AddressDto'][]
      /** @description List of operators for this prison */
      operators?: components['schemas']['PrisonOperatorDto'][]
    }
    /** @description List of operators for this prison */
    PrisonOperatorDto: {
      /**
       * @description Prison operator name
       * @example PSP, G4S
       */
      name: string
    }
    /** @description List of types for this prison */
    PrisonTypeDto: {
      /**
       * @description Prison type code
       * @example HMP
       * @enum {string}
       */
      code: 'HMP' | 'YOI' | 'IRC' | 'STC' | 'YCS'
      /**
       * @description Prison type description
       * @example Her Majesty’s Prison
       */
      description: string
    }
    /** @description Address Update Record */
    UpdateAddressDto: {
      /**
       * @description Address line 1
       * @example Bawtry Road
       */
      addressLine1?: string
      /**
       * @description Address line 2
       * @example Hatfield Woodhouse
       */
      addressLine2?: string
      /**
       * @description Village/Town/City
       * @example Doncaster
       */
      town: string
      /**
       * @description County
       * @example South Yorkshire
       */
      county?: string
      /**
       * @description Postcode
       * @example DN7 6BW
       */
      postcode: string
      /**
       * @description Country
       * @example England
       */
      country: string
    }
    /** @description Prison Insert Record */
    InsertPrisonDto: {
      /**
       * @description Prison Id
       * @example MDI
       */
      prisonId: string
      /**
       * @description Name of the prison
       * @example HMP Moorland
       */
      prisonName: string
      /** @description Whether the prison is still active */
      active?: boolean
      /** @description If this is a male prison */
      male?: boolean
      /** @description If this is a female prison */
      female?: boolean
      /** @description If this is a contracted prison */
      contracted: boolean
      /**
       * @description Set of types for this prison
       * @example HMP
       */
      prisonTypes?: ('HMP' | 'YOI' | 'IRC' | 'STC' | 'YCS')[]
      /** @description List of addresses for this prison */
      addresses?: components['schemas']['UpdateAddressDto'][]
    }
    DlqMessage: {
      body: {
        [key: string]: Record<string, never> | undefined
      }
      messageId: string
    }
    GetDlqResult: {
      /** Format: int32 */
      messagesFoundCount: number
      /** Format: int32 */
      messagesReturnedCount: number
      messages: components['schemas']['DlqMessage'][]
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}

export type external = Record<string, never>

export interface operations {
  /** Get a prison's Videolink Conferencing Centre email address */
  getEmailForVideoConferencingCentre: {
    parameters: {
      path: {
        /**
         * @description Prison ID
         * @example MDI
         */
        prisonId: string
      }
    }
    responses: {
      /** @description Returns the email address */
      200: {
        content: {
          'text/plain': unknown
        }
      }
      /** @description Client error - invalid prisonId or similar */
      400: {
        content: {
          'text/plain': string
        }
      }
      /** @description The prison does not have a Videolink Conferencing Centre email address */
      404: {
        content: {
          'text/plain': string
        }
      }
    }
  }
  /** Set or change a prison's Videolink Conferencing Centre email address */
  putEmailAddressForVideolinkConferencingCentre: {
    parameters: {
      path: {
        /**
         * @description Prison ID
         * @example MDI
         */
        prisonId: string
      }
    }
    requestBody: {
      content: {
        'text/plain': string
      }
    }
    responses: {
      /** @description The email address was created */
      201: never
      /** @description The email address was updated */
      204: never
      /** @description Client error - invalid prisonId, email address or similar */
      400: never
      /** @description No prison found for the supplied prison id */
      404: never
    }
  }
  /** Remove a prison's Videolink Conferencing Centre email address */
  deleteEmailAddressForVideolinkConferencingCentre: {
    parameters: {
      path: {
        /**
         * @description Prison ID
         * @example MDI
         */
        prisonId: string
      }
    }
    responses: {
      /** @description The email address was removed */
      204: never
      /** @description Client error - invalid prisonId or similar */
      400: never
    }
  }
  /** Get a prison's Offender Management Unit email address */
  getEmailForOffenderManagementUnit: {
    parameters: {
      path: {
        /**
         * @description Prison ID
         * @example MDI
         */
        prisonId: string
      }
    }
    responses: {
      /** @description Returns the email address */
      200: {
        content: {
          'text/plain': unknown
        }
      }
      /** @description Client error - invalid prisonId or similar */
      400: {
        content: {
          'text/plain': string
        }
      }
      /** @description The prison does not have a Offender Management Unit email address */
      404: {
        content: {
          'text/plain': string
        }
      }
    }
  }
  /** Set or change a prison's Offender Management Unit email address */
  putEmailAddressForOffenderManagementUnit: {
    parameters: {
      path: {
        /**
         * @description Prison ID
         * @example MDI
         */
        prisonId: string
      }
    }
    requestBody: {
      content: {
        'text/plain': string
      }
    }
    responses: {
      /** @description The email address was created */
      201: never
      /** @description The email address was updated */
      204: never
      /** @description Client error - invalid prisonId, email address, media type or similar */
      400: never
      /** @description No prison found for the supplied prison id */
      404: never
    }
  }
  /** Remove a prison's Offender Management Unit email address */
  deleteEmailAddressForOffenderManagementUnit: {
    parameters: {
      path: {
        /**
         * @description Prison ID
         * @example MDI
         */
        prisonId: string
      }
    }
    responses: {
      /** @description The email address was removed */
      204: never
      /** @description Client error - invalid prisonId or similar */
      400: never
    }
  }
  retryDlq: {
    parameters: {
      path: {
        dlqName: string
      }
    }
    responses: {
      /** @description OK */
      200: {
        content: {
          '*/*': components['schemas']['RetryDlqResult']
        }
      }
    }
  }
  retryAllDlqs: {
    responses: {
      /** @description OK */
      200: {
        content: {
          '*/*': components['schemas']['RetryDlqResult'][]
        }
      }
    }
  }
  purgeQueue: {
    parameters: {
      path: {
        queueName: string
      }
    }
    responses: {
      /** @description OK */
      200: {
        content: {
          '*/*': components['schemas']['PurgeQueueResult']
        }
      }
    }
  }
  /**
   * Update specified prison details
   * @description Updates prison information, role required is MAINTAIN_REF_DATA
   */
  updatePrison: {
    parameters: {
      path: {
        /**
         * @description Prison Id
         * @example MDI
         */
        prisonId: string
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdatePrisonDto']
      }
    }
    responses: {
      /** @description Prison Information Updated */
      200: {
        content: {
          'application/json': components['schemas']['PrisonDto']
        }
      }
      /** @description Information request to update prison */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to make prison update */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Prison ID not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /**
   * Update specified address details
   * @description Updates address information, role required is MAINTAIN_REF_DATA
   */
  updateAddress: {
    parameters: {
      path: {
        /**
         * @description Prison Id
         * @example MDI
         */
        prisonId: string
        /**
         * @description Address Id
         * @example 234231
         */
        addressId: string
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateAddressDto']
      }
    }
    responses: {
      /** @description Address Information Updated */
      200: {
        content: {
          'application/json': components['schemas']['AddressDto']
        }
      }
      /** @description Bad Information request to update address */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to make address update */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Address Id not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /**
   * Delete specified address for specified Prison
   * @description Deletes address information for a Prison, role required is MAINTAIN_REF_DATA
   */
  deleteAddress: {
    parameters: {
      path: {
        /**
         * @description Prison Id
         * @example MDI
         */
        prisonId: string
        /**
         * @description Address Id
         * @example 234231
         */
        addressId: string
      }
    }
    responses: {
      /** @description Address Information Deleted */
      200: never
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to make address update */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Address Id not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /**
   * Adds a new prison
   * @description Adds new prison information, role required is MAINTAIN_REF_DATA
   */
  insertPrison: {
    requestBody: {
      content: {
        'application/json': components['schemas']['InsertPrisonDto']
      }
    }
    responses: {
      /** @description Prison Information Inserted */
      201: {
        content: {
          'application/json': components['schemas']['PrisonDto']
        }
      }
      /** @description Information request to add prison */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to make prison insert */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /**
   * Add Address to existing Prison
   * @description Adds an additional Address to an existing Prison, role required is MAINTAIN_REF_DATA
   */
  addAddress: {
    parameters: {
      path: {
        /**
         * @description Prison Id
         * @example MDI
         */
        prisonId: string
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateAddressDto']
      }
    }
    responses: {
      /** @description New Address added to Prison */
      200: {
        content: {
          'application/json': components['schemas']['AddressDto']
        }
      }
      /** @description Bad Information request to update address */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Unauthorized to access this endpoint */
      401: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Incorrect permissions to add Prison address */
      403: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Prison Id not found */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  getDlqMessages: {
    parameters: {
      query: {
        maxMessages: number
      }
      path: {
        dlqName: string
      }
    }
    responses: {
      /** @description OK */
      200: {
        content: {
          '*/*': components['schemas']['GetDlqResult']
        }
      }
    }
  }
  /**
   * Get all prisons
   * @description All prisons
   */
  getPrisons: {
    responses: {
      /** @description Successful Operation */
      200: {
        content: {
          'application/json': components['schemas']['PrisonDto'][]
        }
      }
    }
  }
  /**
   * Get prisons from active and text search
   * @description All prisons
   */
  getPrisonsBySearchFilter: {
    parameters: {
      query: {
        /**
         * @description Active
         * @example true
         */
        active?: boolean
        /**
         * @description Text search
         * @example Sheffield
         */
        textSearch?: string
        /**
         * @description Genders to filter by
         * @example MALE, FEMALE
         */
        genders?: ('MALE' | 'FEMALE')[]
        /**
         * @description Prison type codes to filter by
         * @example HMP, YOI
         */
        prisonTypeCodes?: ('HMP' | 'YOI' | 'IRC' | 'STC' | 'YCS')[]
      }
    }
    responses: {
      /** @description Successful Operation */
      200: {
        content: {
          'application/json': components['schemas']['PrisonDto'][]
        }
      }
    }
  }
  /**
   * Get specified prison
   * @description Information on a specific prison
   */
  getPrisonFromId: {
    parameters: {
      path: {
        /**
         * @description Prison ID
         * @example MDI
         */
        prisonId: string
      }
    }
    responses: {
      /** @description Successful Operation */
      200: {
        content: {
          'application/json': components['schemas']['PrisonDto']
        }
      }
    }
  }
  /**
   * Get specified prison
   * @description Information on a specific prison address
   */
  getAddressFromId: {
    parameters: {
      path: {
        /**
         * @description Prison ID
         * @example MDI
         */
        prisonId: string
        /**
         * @description Address Id
         * @example 234231
         */
        addressId: string
      }
    }
    responses: {
      /** @description Successful Operation */
      200: {
        content: {
          'application/json': components['schemas']['AddressDto']
        }
      }
    }
  }
  /** Get GP practice code about specified prison */
  getPrisonFromId_1: {
    parameters: {
      path: {
        /**
         * @description Prison ID
         * @example MDI
         */
        prisonId: string
      }
    }
    responses: {
      /** @description Bad request.  Wrong format for prison_id. */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description Prison not found. */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
  /** Get specified prison from GP practice code */
  getPrisonFromGpPrescriber: {
    parameters: {
      path: {
        /**
         * @description GP Practice Code
         * @example Y05537
         */
        gpPracticeCode: string
      }
    }
    responses: {
      /** @description Bad request.  Wrong format for GP practice code. */
      400: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
      /** @description No prison linked to the GP practice code. */
      404: {
        content: {
          'application/json': components['schemas']['ErrorResponse']
        }
      }
    }
  }
}
