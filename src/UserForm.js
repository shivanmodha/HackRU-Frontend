import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import {instanceOf} from 'prop-types';
import {CookiesProvider, withCookies, Cookies} from 'react-cookie';

class UserForm extends React.Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };

  constructor(props){
    super(props);
    this.state = {};
    this.state.mentorBit = {};

    //this.componentDidMount = this.componentDidMount.bind(this);
    this.logout = this.logout.bind(this);
    this.save = this.save.bind(this);
    this.onChange = this.onChange.bind(this);
    this.mentorBitOnChange = this.mentorBitOnChange.bind(this);
    this.LogoutButtons = this.LogoutButtons.bind(this);

    this.showVolunteer = this.showVolunteer.bind(this);
    this.showMentor = this.showMentor.bind(this);
    this.volunteerAndMentorForms = this.volunteerAndMentorForms.bind(this);
    this.applyMentor = this.applyMentor.bind(this);
    this.unapplyMentor = this.unapplyMentor.bind(this);
    this.applyVolunteer = this.applyVolunteer.bind(this);
    this.unapplyVolunteer = this.unapplyVolunteer.bind(this);
    this.componentWillMount = this.componentWillMount.bind(this);
  }

  componentWillMount (){
    const { cookies } = this.props;//I don't get it.
    const auth = cookies.get('authdata');
    if(!auth || Date.parse(auth.auth.valid_until) < Date.now()){
      //we assume any authdata cookie is our authdata and check the validity.
      ReactDOM.render(
          <CookiesProvider>
            <App/>
          </CookiesProvider>,
          document.getElementById('register-root')
      );
      return;
    }else{
      this.setState({
        email: auth.email,
        token: auth.auth.token
      });
    }
  }

  componentDidMount(){
    fetch('https://m7cwj1fy7c.execute-api.us-west-2.amazonaws.com/test/read', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        //'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'email': this.state.email,
        'token': this.state.token,
        'query': {'email': this.state.email}
      })
    }).then(resp => resp.json())
      .then(data => {
        const redact_keys = ['level_of_study', 'auth', 'password', 'short_answer', 'mlh', 'registration_status', 'role', 'volunteer_data', 'mentor_data'];
        const og_usr = data.body[0];
        let newser = {};
        Object.keys(og_usr).map(key => {
          if(!redact_keys.includes(key)){
            if(key !== 'school')
              newser[key] = og_usr[key];
            else
              newser[key] = 'Rutgers University';
          }
        });
        this.setState({user: newser});
        if(og_usr.mentor_data){
          this.setState({mentorBit: og_usr.mentor_data.skills})
        }else{
          this.setState({
            mentorBit: {
              ment_ed: "",
              ment_exp: "",
              ment_langs: "",
              ment_areas: "",
            }
          });
        }
        if(og_usr.role.mentor && og_usr.role.volunteer){
          this.setState({extraFlash: "You've already applied to mentor and volunteer. Thank you!"});
        }else if(og_usr.role.mentor){
          this.setState({extraFlash: "You've already applied to mentor. Thank you!"});
        }else if(og_usr.role.volunteer){
          this.setState({extraFlash: "You've already applied to volunteer. Thank you!"});
        }
    }).catch(data => this.setState({flash: data.toString()}));
  }

  logout() {
    const {cookies} = this.props;
    cookies.remove('authdata');
    ReactDOM.render(<CookiesProvider><App /></CookiesProvider> , document.getElementById('register-root'));
  }

  onChange(e){
    const upd_key = e.target.id.split('-')[1];
    let updated = this.state.user;
    updated[upd_key] = e.target.value;
    this.setState({user: updated});
  }

  mentorBitOnChange(e){
    const upd_key = e.target.id.substring(0, e.target.id.length - 4).replace('-', '_');
    console.log(upd_key);
    let newMent = this.state.mentorBit;
    newMent[upd_key] = e.target.value;
    console.log(newMent);
    this.setState({mentorBit: newMent});
  }

  save() {
    fetch('https://m7cwj1fy7c.execute-api.us-west-2.amazonaws.com/test/update', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updates :this.state.user,
        user_email: this.state.email,
        auth_email: this.state.email,
        auth: this.state.token
      })
    }).then(data => data.json())
      .then(json => {
        if(json.statusCode == 200){
           this.setState({flash: "Updated profile! Thank you for registering."});
        }else{
           this.setState({flash: json.body});
        }
      });

  }

  LogoutButtons(){
    return (
				<div className="form-group ">
					<div className="col-12 text-center">
						<br/>
						<button onClick={this.logout} type="button" className="btn btn-primary custom-btn mx-2" data-dismiss="modal"><h4 className="my-1">Disembark</h4></button>
						<button onClick={this.save} type="button" className="btn btn btn-primary custom-btn"><h4 className="my-1">Drop the Anchor</h4></button>
					</div>
				</div>
    )

  }

  showVolunteer(e){
    document.getElementById('mentor-form').style.display = "none";
    document.getElementById('volunteer-form').style.display = "block";
  }

  showMentor(e){
    document.getElementById('mentor-form').style.display = "block";
    document.getElementById('volunteer-form').style.display = "none";
  }

  getTimes(prefix){
    let times = [];
    if(document.getElementById('sat-morn-' + prefix + '-inp').checked === true){
      times.push("Saturday morning");
    }
    if(document.getElementById('sat-noon-' + prefix + '-inp').checked === true){
      times.push("Saturday afternoon");
    }
    if(document.getElementById('sat-night-' + prefix + '-inp').checked === true){
      times.push("Saturday evening");
    }
    if(document.getElementById('sun-' + prefix + '-inp').checked === true){
      times.push("Sunday morning");
    }
    return times;
  }

  applyMentor(e){
    let tempUsr = {
        "role.mentor": true
    };
    tempUsr.mentor_data = {
      skills: this.state.mentorBit,
      times: this.getTimes('ment')
    }

    fetch('https://m7cwj1fy7c.execute-api.us-west-2.amazonaws.com/test/update', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updates : tempUsr,
        user_email: this.state.email,
        auth_email: this.state.email,
        auth: this.state.token
      })
    }).then(data => data.json())
      .then(json => {
        if(json.statusCode == 200){
           this.setState({extraFlash: "Thank you for your interest in becoming a mentor. We will be in contact with you shortly!"});
        }else{
           this.setState({extraFlash: json.body});
        }
      });
  }

  unapplyMentor(e){
    let tempUsr = {
        "role.mentor": false
    };

    fetch('https://m7cwj1fy7c.execute-api.us-west-2.amazonaws.com/test/update', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updates : tempUsr,
        user_email: this.state.email,
        auth_email: this.state.email,
        auth: this.state.token
      })
    }).then(data => data.json())
      .then(json => {
        if(json.statusCode == 200){
           this.setState({extraFlash: "Updated profile!"});
        }else{
           this.setState({extraFlash: json.body});
        }
      });
  }

  applyVolunteer(e){
    let tempUsr = {
        "role.volunteer": true
    };
    tempUsr.volunteer_data = {
      skills: document.querySelector('input[name="vol-cat"]:checked').value,
      times: this.getTimes('vol')
    }

    fetch('https://m7cwj1fy7c.execute-api.us-west-2.amazonaws.com/test/update', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updates : tempUsr,
        user_email: this.state.email,
        auth_email: this.state.email,
        auth: this.state.token
      })
    }).then(data => data.json())
      .then(json => {
        if(json.statusCode == 200){
           this.setState({extraFlash: "Thank you for your interest in becoming a volunteer. We will be in contact with you shortly!"});
        }else{
           this.setState({extraFlash: json.body});
        }
      });
  }

  unapplyVolunteer(e){
    let tempUsr = {
        "role.volunteer": false
    };

    fetch('https://m7cwj1fy7c.execute-api.us-west-2.amazonaws.com/test/update', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updates :tempUsr,
        user_email: this.state.email,
        auth_email: this.state.email,
        auth: this.state.token
      })
    }).then(data => data.json())
      .then(json => {
        if(json.statusCode == 200){
           this.setState({extraFlash: "Updated profile!"});
        }else{
           this.setState({extraFlash: json.body});
        }
      });
  }

  volunteerAndMentorForms() {
    return (
      <div id="extra-form-container">
        <button className="btn btn-success mr-2" onClick={this.showVolunteer} value="Apply to volunteer">Volunteer Sign Up</button>
        <button className="btn btn-primary" onClick={this.showMentor} value="Apply to mentor">Mentor Sign Up</button>
        <div id="volunteer-form" style={{display:'none'}}>
          <div className="extra-left">
            Choose your preferred area:<br/>
            <input name="vol-cat"  type="radio" value="set-up" id="set-up-vol-inp"></input>
            <label htmlFor="set-up-vol-inp">Set-up</label><br/>
            <input name="vol-cat"  type="radio" value="registration" id="registration-vol-inp"></input>
            <label htmlFor="registration-vol-inp">Registration</label><br/>
            <input name="vol-cat"  type="radio" value="event" id="event-vol-inp"></input>
            <label htmlFor="event-vol-inp">Events</label><br/>
            <input name="vol-cat"  type="radio" value="workshop" id="workshop-vol-inp"></input>
            <label htmlFor="workshop-vol-inp">Workshops</label><br/>
            <input name="vol-cat"  type="radio" value="food" id="food-vol-inp"></input>
            <label htmlFor="food-vol-inp">Food</label><br/>
          </div>
          <div className="extra-right">
            Choose your preferred times:<br/>
            <input name="vol-time"  type="checkbox" value="sat-morn" id="sat-morn-vol-inp"></input>
            <label htmlFor="sat-morn-vol-inp">Saturday (24th) Morning</label><br/>
            <input name="vol-time"  type="checkbox" value="sat-noon" id="sat-noon-vol-inp"></input>
            <label htmlFor="sat-noon-vol-inp">Saturday (24th) Afternoon</label><br/>
            <input name="vol-time"  type="checkbox" value="sat-night" id="sat-night-vol-inp"></input>
            <label htmlFor="sat-night-vol-inp">Saturday (24th) Evening</label><br/>
            <input name="vol-time"  type="checkbox" value="sun" id="sun-vol-inp"></input>
            <label htmlFor="sun-vol-inp">Sunday (25th) Morning</label><br/>
          </div>
          <div className="clearfix"></div>
          <button className="btn btn-primary" onClick={this.applyVolunteer}>Submit Application</button>
        </div>
        <div id="mentor-form" style={{display:'none'}}>
          <div className="extra-left">
            <label htmlFor="ment-ed-inp">Education Level</label>
            <textarea onChange={this.mentorBitOnChange} name="ment-ed" id="ment-ed-inp" value={this.state.mentorBit.ment_ed}></textarea>
            <label htmlFor="ment-exp-inp">Relevant Experience</label>
            <textarea onChange={this.mentorBitOnChange} name="ment-exp" id="ment-exp-inp" value={this.state.mentorBit.ment_exp}></textarea>
            <label htmlFor="ment-areas-inp">Areas of Expertise</label>
            <textarea onChange={this.mentorBitOnChange} name="ment-areas" id="ment-areas-inp" value={this.state.mentorBit.ment_areas}></textarea>
            <label htmlFor="ment-langs-inp">Programming Languages</label>
            <textarea onChange={this.mentorBitOnChange} name="ment-langs" id="ment-langs-inp" value={this.state.mentorBit.ment_langs}></textarea>
          </div>
          <div className="extra-right">
            Choose your preferred times:<br/>
            <input name="ment-time"  type="checkbox" value="sat-morn" id="sat-morn-ment-inp"></input>
            <label htmlFor="sat-morn-ment-inp">Saturday (24th) Morning</label><br/>
            <input name="ment-time"  type="checkbox" value="sat-noon" id="sat-noon-ment-inp"></input>
            <label htmlFor="sat-noon-ment-inp">Saturday (24th) Afternoon</label><br/>
            <input name="ment-time"  type="checkbox" value="sat-night" id="sat-night-ment-inp"></input>
            <label htmlFor="sat-night-ment-inp">Saturday (24th) Evening</label><br/>
            <input name="ment-time"  type="checkbox" value="sun" id="sun-ment-inp"></input>
            <label htmlFor="sun-ment-inp">Sunday (25th) Morning</label><br/>
          </div>
          <div className="clearfix"></div>
          <button className="btn btn-primary" onClick={this.applyMentor}>Submit Application</button>
        </div>
        <p>{this.state.extraFlash}</p>
      </div>
    );
  }

  render() {
    //pardon my indentation - David used tabs.
    return (
    <div>
    <div className="modal-body">
      <div className="react-form font-modal">

			   <form className="form-group">
				    <div className="form-group row my-5">
	             <h4 className="font-modal">Please update your data.</h4>
            </div>

        <span>
        { this.state.user &&
            Object.keys(this.state.user)
              .map(key =>
                 <div className="form-group row my-5">
                        <label htmlFor={"input-" + key} className="col-lg-3 "><h4 className="font-weight-bold font-modal">{key.replace(/_/g, ' ').toUpperCase()}</h4></label>
                        <input type="input" id={"input-" + key} value={this.state.user[key]} onChange={this.onChange} className="form-control"/><br/>
                 </div>
            )
        }
        </span>
				<div className="form-group row my-5">
          <h4 className="font-modal">{this.state.flash}</h4>
        </div>
          </form>
      </div>

    </div>

    <div className="modal-footer">
    <this.LogoutButtons />
    </div>
  </div>

    );

  }

}

export default withCookies(UserForm);
