//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace FIZ_Markerspace.Models
{
    using System;
    using System.Collections.Generic;
    
    public partial class User
    {
        public System.Guid user_id { get; set; }
        public string wsu_id { get; set; }
        public string rfid_tag { get; set; }
        public string first_name { get; set; }
        public string last_name { get; set; }
        public int role { get; set; }
        public int exp_level { get; set; }
        public string password { get; set; }
        public string creation_date { get; set; }
        public string est_grad_date { get; set; }
    }
}
