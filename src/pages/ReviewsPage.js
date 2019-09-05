import React, { Component, Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from 'react-intl';
import { Grid, InputAdornment, IconButton } from "@material-ui/core";
import FilterIcon from "@material-ui/icons/FilterList";
import FeedbackIcon from "@material-ui/icons/SpeakerNotesOutlined";
import ReviewIcon from "@material-ui/icons/PersonAdd";
import {
    formatMessage, formatMessageWithValues, chip, TextInput, AmountInput,
    withHistory, historyPush, withModulesManager, PublishedComponent,
    journalize
} from "@openimis/fe-core";
import ClaimSearcher from "../components/ClaimSearcher";
import {
    selectForFeedback, bypassFeedback, skipFeedback,
    selectForReview, bypassReview, skipReview,
    process
} from "../actions";
import { withTheme, withStyles } from "@material-ui/core/styles";

const styles = theme => ({
    item: {
        padding: theme.spacing(1)
    },
    toggledButton: {
        backgroundColor: theme.palette.toggledButton
    }
});

class RawFixFilter extends Component {
    state = {
        random: 0,
        value: 0,
        variance: 0,
        filters: {},
    }
    componentDidMount() {
        this.setState(this.props.modulesManager.getConf(
            "fe-claim",
            "claim.ReviewsPage.initState",
            { random: 5, value: 0, variance: 10 }
        ));
    }
    randomChange = (v) => {
        let filters = this.state.filters;
        delete (filters.random)
        this.setState({
            random: parseFloat(v),
            filters
        })
    }
    valueChange = (v) => {
        let filters = this.state.filters;
        delete (filters.value)
        this.setState({
            value: parseFloat(v),
            filters
        })
    }
    varianceChange = (v) => {
        let filters = this.state.filters;
        delete (filters.value)
        this.setState({
            variance: parseFloat(v),
            filters
        })
    }
    toggleRandomFilter = (e) => {
        let filters = this.state.filters;
        if (!!filters.random) {
            delete (filters.random);
        } else {
            filters.random = [`random: ${this.state.random}`]
        }
        this.setState(
            { filters },
            e => this.props.filtersChange(Object.values(this.state.filters).flat())
        )
    }
    toggleValueFilter = (e) => {
        let filters = this.state.filters;
        if (!!filters.value) {
            delete (filters.value);
        } else {
            let min = this.state.value;
            let max = this.state.value;
            if (this.state.variance !== 0) {
                min = min - min * this.state.variance / 100;
                max = max + max * this.state.variance / 100;
            }
            filters.value = [`claimed_Gte: ${min}`, `claimed_Lte: ${max}`]
        }
        this.setState({ filters },
            e => this.props.filtersChange(Object.values(this.state.filters).flat())
        )
    }
    render() {
        const { classes } = this.props;
        return (
            <Grid container justify="center" alignItems="center" direction="row">
                <Grid item xs={3} className={classes.item}>
                    <TextInput
                        module="claim" label="ClaimFilter.Reviews.random"
                        name="random"
                        value={this.state.random}
                        onChange={this.randomChange}
                        startAdornment={<InputAdornment position="start">%</InputAdornment>}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    className={!!this.state.filters.random ? classes.toggledButton : null}
                                    onClick={this.toggleRandomFilter}
                                    edge="end">
                                    <FilterIcon />
                                </IconButton>
                            </InputAdornment>
                        }
                        inputProps={{
                            step: 10,
                            min: 0,
                            max: 100,
                            type: "number",
                        }}
                    />
                </Grid>
                <Grid item xs={2} className={classes.item} />
                <Grid item xs={3} className={classes.item}>
                    <Grid container diretcion="row">
                        <Grid item xs={6}>
                            <AmountInput
                                module="claim" label="ClaimFilter.Reviews.value"
                                value={this.state.value}
                                onChange={this.valueChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextInput
                                module="claim" label="ClaimFilter.Reviews.variance"
                                value={this.state.variance}
                                onChange={this.varianceChange}
                                startAdornment={
                                    <InputAdornment position="start">%</InputAdornment>
                                }
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            className={!!this.state.filters.value ? classes.toggledButton : null}
                                            onClick={this.toggleValueFilter}
                                            edge="end">
                                            <FilterIcon />
                                        </IconButton>
                                    </InputAdornment>
                                }
                                inputProps={{
                                    step: 10,
                                    min: 0,
                                    max: 100,
                                    type: "number",
                                }}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        )
    }
}

const FixFilter = withModulesManager(withTheme(withStyles(styles)(RawFixFilter)))

class ReviewsPage extends Component {

    state = {
        forcedFilters: [],
    }

    constructor(props) {
        super(props);
        this.state = {
            defaultFilters: props.modulesManager.getConf(
                "fe-claim",
                "reviews.defaultFilters",
                {
                    "claimStatus": {
                        "value": 4,
                        "chip": chip(
                            this.props.intl, "claim", "claimStatus",
                            formatMessage(this.props.intl, "claim", "claimStatus.2")
                        ),
                        "filter": "status: 2"
                    }
                }
            )
        }
    }

    _filterOnUserHealthFacilityFullPath() {
        let defaultFilters = { ...this.state.defaultFilters }
        defaultFilters.healthFacility = {
            "value": this.props.userHealthFacilityFullPath,
            "chip": chip(
                this.props.intl, "claim", "ClaimFilter.healthFacility",
                this.props.userHealthFacilityStr),
            "filter": `healthFacility_Id: "${this.props.userHealthFacilityFullPath.id}"`
        }
        let district = this.props.userHealthFacilityFullPath.location;
        defaultFilters.district = {
            "value": district,
            "chip": chip(
                this.props.intl, "claim", "ClaimFilter.district",
                this.props.userDistrictStr),
            "filter": `healthFacility_Location_Id: "${district.id}"`
        }
        let region = district.parent;
        defaultFilters.region = {
            "value": region,
            "chip": chip(
                this.props.intl, "claim", "ClaimFilter.region",
                this.props.userDistrictStr),
            "filter": `healthFacility_Location_Parent_Id: "${region.id}"`
        }
        this.setState({ defaultFilters })
    }

    componentDidMount() {
        if (!!this.props.userHealthFacilityFullPath) {
            this._filterOnUserHealthFacilityFullPath();
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.submittingMutation && !this.props.submittingMutation) {
            this.props.journalize(this.props.mutation);
        }
        if (!_.isEqual(prevProps.userHealthFacilityFullPath, this.props.userHealthFacilityFullPath)) {
            this._filterOnUserHealthFacilityFullPath();
        }
    }

    filtersChange = forcedFilters => this.setState({ forcedFilters })

    _labelMutation = (selection, labelOne, labelMultiple, action) => {
        if (selection.length === 1) {
            action(selection,
                formatMessageWithValues(
                    this.props.intl,
                    "claim",
                    labelOne,
                    { code: selection[0].code }
                ));
        } else {
            action(selection,
                formatMessageWithValues(
                    this.props.intl,
                    "claim",
                    labelMultiple,
                    { count: selectionlength }
                ));
        }
    }

    canMarkSelectedForFeedback = selection => !!selection && selection.length && selection.filter(s => s.feedbackStatus <= 2).length === selection.length

    markSelectedForFeedback = selection => {
        this._labelMutation(selection,
            "SelectClaimForFeedback.mutationLabel",
            "SelectClaimsForFeedback.mutationLabel",
            this.props.selectForFeedback);
    }

    canMarkBypassedFeedback = selection => !!selection && selection.length && selection.filter(s => s.feedbackStatus === 4).length === selection.length

    markBypassedFeedback = selection => {
        this._labelMutation(selection,
            "BypassClaimFeedback.mutationLabel",
            "BypassClaimsFeedback.mutationLabel",
            this.props.bypassFeedback);
    }

    canMarkSkippedFeedback = selection => !!selection && selection.length

    markSkippedFeedback = selection => {
        this._labelMutation(selection,
            "SkipClaimFeedback.mutationLabel",
            "SkipClaimsFeedback.mutationLabel",
            this.props.skipFeedback);
    }

    canMarkSelectedForReview = selection => !!selection && selection.length && selection.filter(s => s.reviewStatus <= 2).length === selection.length

    markSelectedForReview = selection => {
        this._labelMutation(selection,
            "SelectClaimForReview.mutationLabel",
            "SelectClaimsForReview.mutationLabel",
            this.props.selectForReview);
    }

    canMarkBypassedReview = selection => !!selection && selection.length && selection.filter(s => s.reviewStatus === 4).length === selection.length

    markBypassedReview = selection => {
        this._labelMutation(selection,
            "BypassClaimReview.mutationLabel",
            "BypassClaimsReview.mutationLabel",
            this.props.bypassReview);
    }

    canMarkSkippedReview = selection => !!selection && selection.length

    markSkippedReview = selection => {
        this._labelMutation(selection,
            "SkipClaimReview.mutationLabel",
            "SkipClaimsReview.mutationLabel",
            this.props.skipReview);
    }

    canProcessSelected = selection => !!selection && selection.length && selection.filter(s => s.status === 4).length === selection.length

    processSelected = selection => {
        this._labelMutation(selection,
            "ProcessClaim.mutationLabel",
            "ProcessClaims.mutationLabel",
            this.props.process);
    }

    onChangeFeedbackStatus = (c, v) => {
        c.feedbackStatus = v;
        switch (v) {
            case 2:
                this.props.skipFeedback([c],
                    formatMessageWithValues(
                        this.props.intl,
                        "claim",
                        "SkipClaimFeedback.mutationLabel",
                        { code: c.code }
                    ));
                break;
            case 4:
                this.props.selectForFeedback([c],
                    formatMessageWithValues(
                        this.props.intl,
                        "claim",
                        "SelectClaimForFeedback.mutationLabel",
                        { code: c.code }
                    ));
                break;
            case 16:
                this.props.bypassFeedback([c],
                    formatMessageWithValues(
                        this.props.intl,
                        "claim",
                        "BypassClaimFeedback.mutationLabel",
                        { code: c.code }
                    ));
                break;
            default: console.log('Illegal new Feedback Status ' + v); // TODO: handle error
        }
    }
    provideFeedback = c => historyPush(this.props.modulesManager, this.props.history, "claim.route.feedback", [c.id])

    feedbackColFormatter = c => (
        <Grid container>
            <Grid item xs={6}>
                <PublishedComponent
                    id="claim.FeedbackStatusPicker"
                    name="feedbackStatus"
                    withNull={false}
                    filtered={[1, 8]}
                    value={c.feedbackStatus}
                    onChange={(v, s) => this.onChangeFeedbackStatus(c, v)}
                />
            </Grid>
            <Grid item xs={6}>
                <IconButton onClick={e => this.provideFeedback(c)}><FeedbackIcon /></IconButton>
            </Grid>
        </Grid>
    )

    onChangeReviewStatus = (c, v) => {
        c.reviewStatus = v;
        switch (v) {
            case 2:
                this.props.skipReview([c],
                    formatMessageWithValues(
                        this.props.intl,
                        "claim",
                        "SkipClaimReview.mutationLabel",
                        { code: c.code }
                    ));
                break;
            case 4:
                this.props.selectForReview([c],
                    formatMessageWithValues(
                        this.props.intl,
                        "claim",
                        "SelectClaimForReview.mutationLabel",
                        { code: c.code }
                    ));
                break;
            case 16:
                this.props.bypassReview([c],
                    formatMessageWithValues(
                        this.props.intl,
                        "claim",
                        "BypassClaimReview.mutationLabel",
                        { code: c.code }
                    ));
                break;
            default: console.log('Illegal new Feedback Status ' + v); // TODO: handle error
        }
    }
    review = c => historyPush(this.props.modulesManager, this.props.history, "claim.route.review", [c.id])
    reviewColFormatter = c => (
        <Grid container>
            <Grid item xs={6}>
                <PublishedComponent
                    id="claim.ReviewStatusPicker"
                    name="reviewStatus"
                    value={c.reviewStatus}
                    withNull={false}
                    filtered={[1, 8]}
                    onChange={(v, s) => this.onChangeReviewStatus(c, v)}
                />
            </Grid>
            <Grid item xs={6}>
                <IconButton onClick={e => this.review(c)}><ReviewIcon /></IconButton>
            </Grid>
        </Grid>
    )

    render() {
        return (
            <ClaimSearcher
                defaultFilters={this.state.defaultFilters}
                forcedFilters={this.state.forcedFilters}
                fixFilter={<FixFilter filtersChange={this.filtersChange} />}
                actions={[
                    { label: "claimSummaries.markSelectedForFeedback", enabled: this.canMarkSelectedForFeedback, action: this.markSelectedForFeedback },
                    { label: "claimSummaries.markBypassedFeedback", enabled: this.canMarkBypassedFeedback, action: this.markBypassedFeedback },
                    { label: "claimSummaries.markSkippedFeedback", enabled: this.canMarkSkippedFeedback, action: this.markSkippedFeedback },
                    { label: "claimSummaries.markSelectedForReview", enabled: this.canMarkSelectedForReview, action: this.markSelectedForReview },
                    { label: "claimSummaries.markBypassedReview", enabled: this.canMarkBypassedReview, action: this.markBypassedReview },
                    { label: "claimSummaries.markSkippedReview", enabled: this.canMarkSkippedReview, action: this.markSkippedReview },
                    { label: "claimSummaries.processSelected", enabled: this.canProcessSelected, action: this.processSelected },
                ]}
                feedbackColFormatter={this.feedbackColFormatter}
                reviewColFormatter={this.reviewColFormatter}
            />
        );
    }
}

const mapStateToProps = state => ({
    userHealthFacilityFullPath: state.loc.userHealthFacilityFullPath,
    userHealthFacilityStr: state.loc.userHealthFacilityStr,
    userRegionStr: state.loc.userRegionStr,
    userDistrictStr: state.loc.userDistrictStr,
    submittingMutation: state.claim.submittingMutation,
    mutation: state.claim.mutation,
});


const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        {
            selectForFeedback,
            bypassFeedback,
            skipFeedback,
            selectForReview,
            bypassReview,
            skipReview,
            process,
            journalize,
        },
        dispatch);
};

export default injectIntl(withHistory(connect(mapStateToProps, mapDispatchToProps)(
    withTheme(withStyles(styles)(ReviewsPage))
)));