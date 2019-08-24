import { parseData, pageInfo, formatServerError, formatGraphQLError } from '@openimis/fe-core';

function reducer(
    state = {
        fetchingClaimAdmins: false,
        fetchedClaimAdmins: false,
        errorClaimAdmins: null,
        claimAdmins: null,
        fetchingClaims: false,
        fetchedClaims: false,
        errorClaims: null,
        claims: null,
        claimsPageInfo: { totalCount: 0 },
        fetchingBatchRuns: false,
        fetchedBatchRuns: false,
        errorBatchRuns: null,
        batchRuns: [],
        fetchingClaim: false,
        fetchedClaim: false,
        errorClaim: null,
        claim: {},
        submittingMutation: false,
        claimMutation: {},
    },
    action,
) {
    switch (action.type) {
        case 'CLAIM_CLAIM_ADMINS_REQ':
            return {
                ...state,
                fetchingClaimAdmins: true,
                fetchedClaimAdmins: false,
                claimAdmins: null,
                errorClaimAdmins: null,
            };
        case 'CLAIM_CLAIM_ADMINS_RESP':
            return {
                ...state,
                fetchingClaimAdmins: false,
                fetchedClaimAdmins: true,
                claimAdmins: parseData(action.payload.data.claimAdmins),
                errorClaimAdmins: formatGraphQLError(action.payload)
            };
        case 'CLAIM_CLAIM_ADMINS_ERR':
            return {
                ...state,
                fetchingClaimAdmins: false,
                errorClaimAdmins: formatServerError(action.payload)
            };
        case 'CLAIM_CLAIMS_REQ':
            return {
                ...state,
                fetchingClaims: true,
                fetchedClaims: false,
                claims: null,
                claimsTotalCount: 0,
                errorClaims: null,
            };
        case 'CLAIM_CLAIMS_RESP':
            return {
                ...state,
                fetchingClaims: false,
                fetchedClaims: true,
                claims: parseData(action.payload.data.claims),
                claimsPageInfo: pageInfo(action.payload.data.claims),
                errorClaims: formatGraphQLError(action.payload)
            };
        case 'CLAIM_CLAIMS_ERR':
            return {
                ...state,
                fetchingClaims: false,
                errorClaims: formatServerError(action.payload)
            };
        case 'CLAIM_CLAIM_REQ':
            return {
                ...state,
                fetchingClaim: true,
                fetchedClaim: false,
                claim: null,
                errorClaim: null,
            };
        case 'CLAIM_CLAIM_RESP':
            let claims = parseData(action.payload.data.claims);
            return {
                ...state,
                fetchingClaim: false,
                fetchedClaim: true,
                claim: (!!claims && claims.length > 0) ? claims[0] : null,
                errorClaims: formatGraphQLError(action.payload)
            };
        case 'CLAIM_CLAIM_ERR':
            return {
                ...state,
                fetchingClaim: false,
                errorClaim: formatServerError(action.payload)
            };
        case 'CLAIM_BATCH_RUNS_REQ':
            return {
                ...state,
                fetchingBatchRuns: true,
                fetchedBatchRuns: false,
                batchRuns: [],
                errorBatchRuns: null,
            };
        case 'CLAIM_BATCH_RUNS_RESP':
            return {
                ...state,
                fetchingBatchRuns: false,
                fetchedBatchRuns: true,
                batchRuns: parseData(action.payload.data.batchRuns),
                errorBatchRuns: formatGraphQLError(action.payload)
            };
        case 'CLAIM_BATCH_RUNS_ERR':
            return {
                ...state,
                fetchingBatchRuns: false,
                errorBatchRuns: formatServerError(action.payload)
            };
        case 'CLAIM_CREATE_CLAIM_REQ':
            return {
                ...state,
                submittingMutation: true,
                claimMutation: action.meta,
            }
        case 'CLAIM_CREATE_CLAIM_RESP':
            var claimMutation = state.claimMutation;
            claimMutation.internalId = action.payload.data.createClaim.internalId;
            return {
                ...state,
                submittingMutation: false,
                claimMutation,
            }
        case 'CLAIM_CREATE_CLAIM_ERR':
            return {
                ...state,
            }
        default:
            return state;
    }
}

export default reducer;
