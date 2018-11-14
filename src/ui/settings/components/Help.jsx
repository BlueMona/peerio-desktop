import React from 'react';
import { when } from 'mobx';
import { observer } from 'mobx-react';
import { remote as electron } from 'electron';

import { contactStore, chatStore, warnings, t } from 'peerio-icebear';
import { Button } from 'peer-ui';

import T from '~/ui/shared-components/T';
import config from '~/config';

const { clipboard } = electron;
const urls = config.translator.urlMap;

@observer
export default class Help extends React.Component {
    support = () => {
        const support = contactStore.getContact(config.contacts.supportUser);
        when(
            () => !support.loading,
            () => {
                chatStore.startChat([support]);
                window.router.push('/app/chats');
            }
        );
    };

    copyLogs = () => {
        clipboard.writeText(console.history.toString());
        warnings.add('snackbar_logsCopied');
    };

    render() {
        return (
            <div className="help-container">
                <section className="section-divider">
                    <div className="title">{t('title_support')}</div>
                    <div className="text">
                        <T k="title_helpText" />
                        <Button
                            icon="live_help"
                            href={urls.helpCenter}
                            tooltip={t('button_HC')}
                            theme="no-hover"
                        />
                    </div>
                    <div className="text">
                        <T k="title_supportIntro" />
                        <Button
                            icon="question_answer"
                            onClick={this.support}
                            tooltip={t('button_supportChat')}
                            theme="no-hover"
                        />
                        <Button
                            icon="email"
                            href={urls.contactSupport}
                            tooltip={t('button_supportEmail')}
                            theme="no-hover"
                        />
                    </div>
                </section>
                <section className="section-divider">
                    <div className="title">{t('title_feedback')}</div>
                    <div className="text">
                        <T k="title_feedbackIntro" />
                        <Button
                            icon="question_answer"
                            onClick={this.support}
                            tooltip={t('button_feedbackChat')}
                            theme="no-hover"
                        />
                    </div>
                </section>
                <section>
                    <div className="title">{t('title_logs')}</div>
                    <div className="text">
                        <T k="title_logsIntro" />
                        <Button
                            icon="content_copy"
                            onClick={this.copyLogs}
                            tooltip={t('button_copyLogs')}
                            theme="no-hover"
                        />
                    </div>
                </section>
            </div>
        );
    }
}
