import type { FrontendConfig } from "../interfaces/FrontendConfig";
import type { KidPlaidAccount } from "../interfaces/KidPlaidAccount";
import * as React from "react";
import { TokenFeedback } from "../interfaces/TokenFeedback";
import { KidSelector } from "./KidSelector";
import { PlaidLink } from "./PlaidLink";

export interface IProps {
  config: FrontendConfig;
}

interface IState {
  kid: string;
  accounts: KidPlaidAccount[];
}

export class App extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      kid: "",
      accounts: props.config.accounts,
    };
    this.onPlaidSuccess = this.onPlaidSuccess.bind(this);
    this.onNewKid = this.onNewKid.bind(this);
    this.submitNewToken = this.submitNewToken.bind(this);
    this.getTokenFromState = this.getTokenFromState.bind(this);
  }

  async submitNewToken(): Promise<void> {
    const { kid } = this.state;
    const token = this.getTokenFromState(kid);
    if (token) {
      try {
        await fetch(this.props.config.pushUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kid, token } as TokenFeedback),
        });
      } catch (err) {
        console.error(err);
      }
    }
  }

  onPlaidSuccess(token: string): void {
    this.setState(
      (state) => ({
        ...state,
        accounts: state.accounts.map((account) => ({
          ...account,
          publicToken: account.kid === state.kid ? token : account.publicToken,
        })),
      }),
      this.submitNewToken
    );
  }

  onNewKid(kid: string): void {
    this.setState((state) => ({ ...state, kid }));
  }

  getTokenFromState(kid: string): string | null {
    return this.state.accounts.reduce((token, account) => {
      if (account.kid === kid) {
        return account.publicToken || null;
      }
      return token;
    }, null as string | null);
  }

  render() {
    const {
      config: { accounts, publicKey, env, products, countryCodes },
    } = this.props;
    const { kid } = this.state;
    const token = this.getTokenFromState(kid);
    return (
      <>
        <KidSelector
          value={kid}
          kids={accounts.map(({ kid }) => kid)}
          onChange={this.onNewKid}
        />
        {kid ? (
          <PlaidLink
            onSuccess={this.onPlaidSuccess}
            env={env}
            product={products}
            publicKey={publicKey}
            countryCodes={countryCodes}
            publicToken={token}
          />
        ) : null}
      </>
    );
  }
}
