import pyodbc
import string


def Clean_Return_String(Input_S):
    Characters_To_Remove = "'(),[] "

    Cleaned_String = Input_S
    for Character in Characters_To_Remove:
        Cleaned_String = Cleaned_String.replace(Character, "")
    return(Cleaned_String)

# Blaine's Local test
# Driver={SQL Server}
# server=192.168.88.252,1433
# UID=admin
# fiz1234

# Fiz tests
# Driver={FreeTDS}
# server=192.168.1.101, 1433
# UID=admin
# PWD=fiz4321


conn = pyodbc.connect('Driver={FreeTDS};'
                      'server=192.168.1.101, 1433;'
                      'Database=fiz_markerspace;'
                      'UID=admin;'
                      'PWD=fiz4321;')

# This value will be hardcoded on each pi, depending on which room the user is in and the machine they are using
Room = "Wood Shop"
Machine_Name = "Saw"

# This is a value to test a user that exisits, and has the proper permissions
# when connected to harwdare it should look somthing like RFID_USER = scan.rfid_value, or somthing similar
RFID_User_Exisits_Allowed = "12345678910"

# All three of these variables must be met for the power relay to be activated
User_Exists = False
User_Access_Room = False
User_Access_Machine = False


#
# SECURITY CHECK ONE, USER MUST EXIST
#
cursor_check_user = conn.cursor()
cursor_check_user.execute(
    "SELECT [rfid_tag] FROM [User] WHERE [rfid_tag] = ?", RFID_User_Exisits_Allowed)
User = cursor_check_user.fetchall()

# User Exisits
if (len(User) == 1):
    print('User RFID has been found!')
    print("")
    print("SECURITY CHECK ONE: PASS")
    print("")
    User_Exists = True
# Error in system, returned too many results (should not be possible)
elif (len(User) > 1):
    print('Error, multiple users returned')
# User not found
else:
    print('User RFID not found!')
#
#
#

#
# SECURITY CHECK TWO, USER MUST BE IN ACCESS LIST
#
if (User_Exists == True):
    cursor_extract_guid = conn.cursor()
    cursor_extract_guid.execute(
        "SELECT convert(nvarchar(50), user_id) FROM [User] WHERE [rfid_tag] = ?", RFID_User_Exisits_Allowed)
    GUID_Result = cursor_extract_guid.fetchall()

    # After the Users GUID is returned, in needs to be cleaned, so it can be used in python as a string
    User_GUID = str(GUID_Result[0])
    User_GUID = Clean_Return_String(User_GUID)
    print("Users GUID: " + User_GUID)
    # After we have extracted the User_GUID we check if the user is included in the room list for the given room

    cursor_check_room_access = conn.cursor()
    cursor_check_room_access.execute(
        "SELECT [user_id] FROM [RoomAccess] WHERE [user_id] = ? AND [room_name] = ?", User_GUID, Room)

    User_Has_Room_Permissions = cursor_check_room_access.fetchall()

    # User exisits in room list for given room
    if (len(User_Has_Room_Permissions) == 1):
        User_Access_Room = True
        print('User has access to this room')
        print("")
        print("SECURITY CHECK TWO: PASS")
        print("")
    # Error in system, returned too many results (should not be possible)
    elif (len(User_Has_Room_Permissions) > 1):
        print('Error, multiple users returned')
    # User not found
    else:
        print('User does not have access to this room!')
#
#
#

#
# SECURITY CHECK THREE, USERS LEVEL MUST BE GREATER THEN OR EQUAL TO THE MACHINES LEVEL
#
if ((User_Exists == True) and (User_Access_Room == True)):
    # Check the Machines Level
    cursor_check_machine_level = conn.cursor()
    cursor_check_machine_level.execute(
        "SELECT [role_access] FROM [Machine] WHERE [machine_name] = ?", Machine_Name)
    M_Level_Result = cursor_check_machine_level.fetchall()

    # After the machine level is returned, it needs to be cleaned, so it can be used in python as a string, then converted later
    M_Level_String = str(M_Level_Result[0])
    M_Level_String = Clean_Return_String(M_Level_String)
    Machine_Level = int(M_Level_String)
    print("Machine Level: " + M_Level_String)

    # Check the Users Level
    cursor_check_user_level = conn.cursor()
    cursor_check_user_level.execute(
        "SELECT [exp_level] FROM [User] WHERE [user_id] = ?", User_GUID)
    U_Level_Result = cursor_check_user_level.fetchall()

    # After the user level is returned, it needs to be cleaned, so it can be used in python as a string, then converted later
    U_Level_String = str(U_Level_Result[0])
    U_Level_String = Clean_Return_String(U_Level_String)
    User_Level = int(U_Level_String)
    print("User Level: " + U_Level_String)

    if(User_Level >= Machine_Level):
        User_Access_Machine = True
        print("User has access to the machine")
        print("")
        print("SECURITY CHECK THREE: PASS")
        print("")
    else:
        print("User does not have access to the machine")

#
# RESULT OF ALL THREE SECURITY CHECKS
#

if ((User_Exists == True) and (User_Access_Room == True) and (User_Access_Machine == True)):
    print("ALL SECURITY CHECKS PASSED, MACHINE ON")
    #
    # Code to turn on machine here
    #
else:
    print("")
    print("SECURITY CHECKS FAILED, NO MACHINE ACCESS")
    print("")
