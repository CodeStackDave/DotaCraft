//////////////////////////////////////////////
// 				Local Variables				//
//////////////////////////////////////////////
// panaroma color table, will most likely make a nettable for this
var COLOUR_TABLE = {}
var Root = $.GetContextPanel();
var LocalPlayerID = Game.GetLocalPlayerID();
		
//////////////////////////////////////////////
// 					BUTTONS					//
//////////////////////////////////////////////

function Sit(){
	var Continue = true;
	if(Root.PlayerID == LocalPlayerID ){
		Root.PlayerID = 9000; 
		Continue = false;
	}else
		Root.PlayerID = LocalPlayerID;
	
	if(Continue){
		$.Msg("Changing slots");
		var Parent = Root.GetParent();
		var SavedInformation = {PlayerTeam : Root.PlayerTeam, PlayerColor : Root.PlayerColor, PlayerRace : Root.PlayerRace};
		for(var i=0; i < i +1;i+=1){
			var PlayerPanel = Parent.GetChild(i);
			if(PlayerPanel == null)
				break;
			
			if( PlayerPanel.PlayerID == LocalPlayerID && Root.PanelID != PlayerPanel.PanelID){
				Root.PlayerTeam = PlayerPanel.PlayerTeam;
				Root.PlayerRace = PlayerPanel.PlayerRace;
				Root.PlayerColor = PlayerPanel.PlayerColor;
				
				PlayerPanel.PlayerID = 9000;
				PlayerPanel.PlayerTeam = SavedInformation.PlayerTeam; 
				PlayerPanel.PlayerRace = SavedInformation.PlayerRace;
				PlayerPanel.PlayerColor = SavedInformation.PlayerColor;
				
				GameEvents.SendCustomGameEventToServer("update_pregame", { "PanelID": PlayerPanel.PanelID, "PlayerIndex": PlayerPanel.PlayerID, "Race": PlayerPanel.PlayerRace, "Team": PlayerPanel.PlayerTeam, "Color": PlayerPanel.PlayerColor});
			};
			
			// this should never be met but just in case lal
			if(i > 100)
				break;
		};
	};
	UpdatePlayer();
};

// ready up button
function ReadyUp(){
	// TOGGLE
	// if not ready, he's now ready
	if (!Root.PlayerReady){
		Root.PlayerReady = true;
	}else{ // if ready, he's now not ready 
		Root.PlayerReady = false;
	};

	UpdatePlayer();
};

// button click function for the team dropdown
function PlayerTeamChanged(){
	var dropdown = Root.FindChildTraverse("TeamDropDown");
	var team_index = dropdown.GetSelected().id;
	
	// set selected dropdown child and assign the index of the GetSelected as the new value
	dropdown.SetSelected(team_index);
	Root.PlayerTeam = parseInt(team_index);
	
	UpdatePlayer();
};

// button click function for the race dropdown
function PlayerRaceChanged(){
	var dropdown = Root.FindChildTraverse("RaceDropDown");
	var race_index = dropdown.GetSelected().id;
	
	// set selected dropdown child and assign the index of the GetSelected as the new value
	dropdown.SetSelected(race_index);
	Root.PlayerRace = parseInt(race_index);	
	
	UpdatePlayer();
};

// button click function for the color dropdown
function PlayerColorChanged(){
	var dropdown = Root.FindChildTraverse("ColorDropDown");
	var color_index = dropdown.GetSelected().id;
	
	// set selected dropdown child and assign the index of the GetSelected as the new value
	dropdown.SetSelected(color_index);
	
	// reset last color
	var previous_dropdown_child = dropdown.FindDropDownMenuChild (Root.PlayerColor);
	previous_dropdown_child.enabled = true;
	previous_dropdown_child.style["border"] = "0px solid black";
	
	// save the new color index in the local variable
	Root.PlayerColor = parseInt(color_index);

	// change background color to match the setselected
	dropdown.style["background-color"] =  "rgb("+COLOUR_TABLE[color_index].r+","+COLOUR_TABLE[color_index].g+","+COLOUR_TABLE[color_index].b+")";
	
	UpdatePlayer();
};

function OptionsInput(){
	var OptionsDropDown = $("#OptionsDropDown");
	var SelectedIndex = parseInt(OptionsDropDown.GetSelected().id);

	if( SelectedIndex != null ){
		switch ( SelectedIndex ){
			case 0:
				Root.PlayerID = 9000;
				break;
			case 1:
				Root.PlayerID = 8999;
				break;				
			case 2:
				Root.PlayerID = 9001;
				break;
			case 3:
				Root.PlayerID = 9002;
				break;
			case 4:
				Root.PlayerID = 9003;
				break;
		};
	};
};

//////////////////////////////////////////////
// 					Player Update			//  
//////////////////////////////////////////////
// update player logic
function UpdatePlayer(){
	// save this info in the playerpanel and send it to lua net_tables
	//$.Msg("Player: #"+Root.PlayerID+" set to Team: #"+Root.PlayerTeam+" with color: "+Root.PlayerColor+" and race: #"+Root.PlayerRace+", ReadyStatus="+Root.PlayerReady+", LockState="+Root.Locked);

	GameEvents.SendCustomGameEventToServer("update_pregame", { "PanelID": Root.PanelID, "PlayerIndex": Root.PlayerID, "Race": Root.PlayerRace, "Team": Root.PlayerTeam, "Color": Root.PlayerColor, "LockState": Root.Locked});
};  

// Globally available panel to this context
(function () {
	// default values
	Root.PlayerRace = 0;
	Root.PlayerTeam = 2;
	Root.PlayerReady = false;
	Root.Locked = false;
	
	// setup functions
	Setup_Panaroma_Color_Table();
	Setup_Colours(Root);
	
	CustomNetTables.SubscribeNetTableListener("dotacraft_pregame_table", NetTableUpdatePlayer);
	CustomNetTables.SubscribeNetTableListener("dotacraft_color_table", Update_Available_Colors);
	
	$.Schedule(0.1, UpdatePlayer);
	$.Schedule(0.1, Update);
})();

// main logic behind updating players, this is called when net_table changed
function NetTableUpdatePlayer(TableName, Key, Value){
	if( Key == Root.PanelID ){
		// variables  
		var PlayerID = Value.PlayerIndex;
		var PanelID = Key; 
		var PlayerPanel = Root;
		
		PlayerPanel.PlayerID = PlayerID;
		$.Msg("Panel ="+Key)

		PlayerPanel.PlayerTeam = Value.Team;
		PlayerPanel.PlayerRace = Value.Race;
		PlayerPanel.PlayerColor = Value.Color;
		PlayerPanel.Locked = Value.LockState;
		
		if ( PlayerID > 9000 ){
			var OptionsDropDown = PlayerPanel.GetChild(1).GetChild(0);
			if ( !isLocalPlayerHost() )
				OptionsDropDown.visible = false;
		};

		$.Msg("[Panel]: "+PanelID+" - [Player]: "+PlayerID+" is updating"); 
		
		// find all drop-downs and update their selection
		for(var index in dotacraft_DropDowns){ 	 
			var dropdown = PlayerPanel.FindChildTraverse(dotacraft_DropDowns[index]);
			
			// determine which dropdown the current index is, and update accordingly
			if(dotacraft_DropDowns[index] == "ColorDropDown"){
				dropdown.SetSelected(Value.Color);
			} 
			else if (dotacraft_DropDowns[index] == "TeamDropDown"){ 
				dropdown.SetSelected(Value.Team);
			}
			else if (dotacraft_DropDowns[index] == "RaceDropDown"){
				dropdown.SetSelected(Value.Race);
				
				// if local player change the race background to match the select race
				if(LocalPlayerID == PlayerID){
					SetRaceBackgroundImage(Value.Race);
				};
			};
		};
	};
	Update_Available_Colors();
}; 

// function which sets the local background image to that of the race
function SetRaceBackgroundImage(race){
	// if race is not 0, which is the random race
	var Left_Bar = Root.GetParent().GetParent();
	if(race != 0){
		// save image path and then assign it in the style
		var team_path = "url('s2r://panorama/images/selection/background_"+race+".png')";
		Left_Bar.style["background-image"] = team_path;
	}else{ // if random
		Left_Bar.style["background-image"] = "url('s2r://panorama/images/backgrounds/gallery_background.png')";
	};
};
 
function Update_Available_Colors(){
	var PlayerIDList = Game.GetAllPlayerIDs();
	var PlayerContainer = Root.GetParent();
	
	ResetColorDropDownState();
	
	var dropdown = Root.FindChildTraverse("ColorDropDown");
	
	for(var ID=0; ID <= ID+1;ID+=1){  
		var PanelToCheck = PlayerContainer.FindChildTraverse(ID);
		if( PanelToCheck != null){
			var color_index = PanelToCheck.PlayerColor;
			var PanelIDToCheck = PanelToCheck.PlayerID;
			
			if( PanelIDToCheck != 9000 && PanelIDToCheck != 8999 ){
				// find dropdown child
				var dropdown_child = dropdown.FindDropDownMenuChild(color_index);
				if( dropdown_child != null){
					dropdown_child.enabled = false;
					dropdown_child.style["border"] = "2px solid black";
				};
			};
		}else
			break;
	};
};

function ResetColorDropDownState(){
	var Parent = Root.GetParent();
	// for all panels
	for(var ID=0; ID < ID+1; ID+=1){
		if(Parent.FindChildTraverse(ID) != null)
			break;
		
		var PlayerPanel = Parent.FindChildTraverse(ID);
				
		// for all ColorID's in dropdown
		var dropdown = PlayerPanel.FindChildTraverse("ColorDropDown");
		if( dropdown != null){
			var ID3 = 0;
			for(var ID2=0; ID2 <= ID3; ID2+=1){ 
				var dropdown_child = dropdown.FindDropDownMenuChild(ID2);
				if( dropdown_child != null ){
					dropdown_child.enabled = true; 
					dropdown_child.style["border"] = "0px solid black";
					ID3++;
				};
			}; 
		};
	};		
};
function Update(){
	PlayerPanelUpdate();
	$.Schedule(0.01, Update);
};

function UpdateDropDownVisibility(){
	var OptionsDropDown = $("#OptionsDropDown");
	var SelectedIndex = OptionsDropDown.GetSelected().id;

	if( SelectedIndex != null ){
		if( Players.IsValidPlayerID(Root.PlayerID) || Root.PlayerID > 9000 ){
			$("#ColorDropDown").visible = true;
			$("#RaceDropDown").visible = true;
			$("#TeamDropDown").visible = true;
		}else{
			$("#ColorDropDown").visible = false;
			$("#RaceDropDown").visible = false;
			$("#TeamDropDown").visible = false;	
		};
	};

	if( isLocalPlayerHost() ){
		OptionsDropDown.visible = true;
			
	};
};

///////////////////////////////////////////////
// 			One-Time INITIALISATION			 //
///////////////////////////////////////////////

var AI_Names = {
	8999: "Closed",
	9000: "Open",
	9001: "COMPUTER (EASY)",
	9002: "COMPUTER (NORMAL)",
	9003: "COMPUTER (HARD)"
}; 

var dotacraft_DropDowns = {
	1: "ColorDropDown",
	2: "TeamDropDown",
	3: "RaceDropDown"
};

// this function sets up all the components for the player once
function PlayerPanelUpdate(){
	var PlayerInfo;
	
	// manage name & image
	if( Players.IsValidPlayerID(Root.PlayerID) ){
		PlayerInfo = Game.GetPlayerInfo(Root.PlayerID);
		
		$("#PlayerAvatar").visible = true;
		// assign steamid to avatar and playername panels
		$("#PlayerAvatar").steamid = PlayerInfo.player_steamid;
		$("#PlayerName").GetChild(0).text = PlayerInfo.player_name;
	}else{
		$("#PlayerAvatar").visible = false;
		$("#PlayerName").GetChild(0).text = AI_Names[Root.PlayerID];  
	};
	
	if( LocalPlayerID == Root.PlayerID )
		Root.SetHasClass("Local", true);
	else
		Root.SetHasClass("Local", false);
	
	// manage hosticon display
	if( isPlayerHost() ){
		// add Host panel class to differentiate between host and normal players
		var Name = $("#PlayerName");
		var HostIcon = $("#Host_Icon");
		if( HostIcon == null ){
			HostIcon = $.CreatePanel("Panel", Name, "Host_Icon");
			HostIcon.SetHasClass("Host", true);	
		}else
			HostIcon.visible = true;
	}else{
		var HostIcon = $("#Host_Icon");
		if(HostIcon != null){
			HostIcon.visible = false;
		};
	};
		
	// set initial dropdown color
	var dropdown = Root.FindChildTraverse("ColorDropDown");
	dropdown.SetSelected(Root.PlayerColor);
	var key = Root.PlayerColor;
	// set dropdown color
	dropdown.style["background-color"] =  "rgb("+COLOUR_TABLE[key].r+","+COLOUR_TABLE[key].g+","+COLOUR_TABLE[key].b+")";
	
	// set dropdown enabled states
	if( Root.Locked )
		if( isLocalPlayerHost() )
			SetDropDownStates(true);	
		else
			SetDropDownStates(false);
	else if( Root.PlayerID == LocalPlayerID || (Root.PlayerID > 9000 && isLocalPlayerHost()) )
		SetDropDownStates(true);
	else  // if Root.Locked && !isHost()
		SetDropDownStates(false);
	
	// check slot is open (playerid 9000)
	if( Root.PlayerID == 9000 )
		$("#SitButton").visible = true;
	else
		$("#SitButton").visible = false
	
	// update dropdown visibilities accordingly
	UpdateDropDownVisibility();
};

function SetDropDownStates(Enabled){
	for(var index in dotacraft_DropDowns){
		var dropdown = Root.FindChildTraverse(dotacraft_DropDowns[index]);	
		dropdown.enabled = Enabled;
	};	
};

function Setup_Panaroma_Color_Table(){
	// store color table inside this var
	var Colors = CustomNetTables.GetAllTableValues("dotacraft_color_table");

	// loop and add the Colors table to the local color table
	for (var key in Colors) {   
		COLOUR_TABLE[key] = { r: Colors[key].value.r, g: Colors[key].value.g, b: Colors[key].value.b };	
	};
};

// setup the colors for the color dropdown
function Setup_Colours(panel){
	//$.Msg("Setting up colours")
	var dropdown = panel.FindChildTraverse("ColorDropDown");

	// count amount of dropdown children
	var count = Count_Dropdown_Children(dropdown, null);
  
	// iterate and assign colors
	for (i = 0; i <= count; i++) {
		var dropdown_child = dropdown.FindDropDownMenuChild(i);
		//$.Msg(COLOUR_TABLE[i].r)  
		dropdown_child.style["background-color"] = "rgb("+COLOUR_TABLE[i].r+","+COLOUR_TABLE[i].g+","+COLOUR_TABLE[i].b+")";
	};
};

///////////////////////////////////////////////
// 				Useful Functions			 //
///////////////////////////////////////////////

// counts how many "DROPDOWN" children can be found, only for dropdowns, since the only child for a dropdown is the selected dropdown child
function Count_Dropdown_Children(dropdown, name){
	// loop until an invalid index is found
	var No_End = 1;
	for (i = 0; i <= No_End; i++) {
		
		// determine whether we're checking an index or a "name_"+index
		var NameToCheck;
		if (name == null){
			NameToCheck = i;
		}
		else{
			NameToCheck = name+i;
		}
			
		// if the current index wasn't a valid child, current index-1 is the total amount of children
		// this assumes you index from 0 - something
		if(!dropdown.FindDropDownMenuChild(NameToCheck)){
			return y = i-1;
			break; 
		}
		 
		No_End++;
	};
};

// check if player is host
function isPlayerHost(){
    var Player_Info = Game.GetPlayerInfo(Root.PlayerID);
    
    if(!Player_Info)
    {
		//$.Msg("Player does not exist = #"+Root.PlayerID);
        return false;
    };

    return Player_Info.player_has_host_privileges;
};

function isLocalPlayerHost(){
    var Player_Info = Game.GetPlayerInfo(LocalPlayerID);
    
    if(!Player_Info)
    {
		//$.Msg("Player does not exist = #"+Root.PlayerID);
        return false;
    };

    return Player_Info.player_has_host_privileges;
};

// unused old example button click
var ChangeColour= (
	function(color_index, playerid, dropdown)
	{
		return function()
		{
			Root.PlayerColor = color_index;
			dropdown.SetSelected(color_index.toString());
			dropdown.style["background-color"] = COLOUR_TABLE[color_index];

			Update_Player();
		};
	});
	