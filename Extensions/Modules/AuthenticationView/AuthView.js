(function AuthView() {
	class AuthView {
		async Setup(com, fun) {
			com = await this.asuper(com);
			

			if (!Cookies('xGraph-Authenticated') && !this.Par.AllowAnon) {
				location.href = this.Par.Redirect || "/login";
			}

			fun(null, com);
		}

		async Render(com, fun) {
			com = await this.asuper(com);
			if(this.Vlt.div.children().length == 0) {
				if (Cookies('xGraph-Authenticated')) {
					this.Vlt.div.append(`
						<div base style="
							height: 48px;
							overflow: hidden;
							white-space: nowrap;
							padding: 6px 8px;
							box-sizing: border-box;
							position: relative;
							cursor: default;
							display: inline-block;">
	
							<img src="https://www.gravatar.com/avatar/${md5(Cookies('xGraph-Email'))}?&d=identicon" alt="" style="
								display: inline;
								height: 36px;
								border-radius: 50%;
								"/>
	
							<div style="
								vertical-align: top;
								display: inline-block;">
								
							<span title="${Cookies('xGraph-Email')}" style="
								padding-left: 6px;
								">${Cookies('xGraph-DisplayName')}</span><br><span style="
								font-size: 13px;
								display: inline;
								padding-left: 6px;
								opacity: 1;">Not ${Cookies('xGraph-DisplayName')}?<a href="${this.Par.LogoutHref || "logout"}" style="color: inherit; text-decoration: none;"> Logout</a></span>
	
						</div>
					`);
				} else {
					this.Vlt.div.append(`
						<div style="">
							<div base style="
								height: 48px;
								overflow: hidden;
								white-space: nowrap;
								padding: 6px 8px;
								box-sizing: border-box;
								position: relative;
								cursor: default;
								display: inline-block;
								"><img src="https://www.gravatar.com/avatar/unauthenticated?&d=identicon&f=y" alt="" style="
									display: inline;
									height: 36px;
									border-radius: 50%;
									" />
								<div style="
									vertical-align: top;
									display: inline-block;">
									
									<span style="
										padding-left: 6px;
										">Logged out</span><br><span style="
										font-size: 13px;
										display: inline;
										padding-left: 6px;
										opacity: 1;">Have an Account? <a href="${this.Par.LoginHref || "login"}" style="color: inherit; text-decoration: none;">Login</a></span>
									
								</div>
							</div>
						</div>
					`);
				}
			}

			fun(null, com);
		}
	}

	return Viewify(AuthView, '3.4');
})();